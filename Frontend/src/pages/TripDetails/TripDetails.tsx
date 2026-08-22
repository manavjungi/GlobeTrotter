import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { ErrorMessage, SuccessMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField, AuthTextArea } from "@/components/Input/AuthField";
import { TripDetailsSkeleton } from "@/components/Loader/Loader";
import { tripCoverStyle } from "@/utils/tripVisual";
import type { Trip, TripActivity, TripStop } from "@/contracts/api";
import { TripActivityStatus } from "@/types/enums";
import {
  createTripActivity,
  createTripStop,
  deleteTripActivity,
  getTripActivities,
  getTripStops,
  updateTripActivity,
} from "@/services/itineraryApi";
import { getTripById } from "@/services/tripApi";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  countTripDays,
  formatDateRange,
  formatDayStamp,
  listTripDays,
  toTimeInput,
} from "@/utils/date";

const activityFormSchema = z
  .object({
    activityName: z.string().trim().min(1, "Activity name is required."),
    location: z.string(),
    tripStopId: z.string().min(1, "Select a destination/stop."),
    activityId: z.string().min(1, "Catalog activity ID is required."),
    activityDate: z.string().min(1, "Day/date is required."),
    startTime: z.string(),
    endTime: z.string(),
    notes: z.string(),
  })
  .refine((values) => !values.startTime || !values.endTime || values.endTime >= values.startTime, {
    message: "End time cannot be before start time.",
    path: ["endTime"],
  });

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const stopFormSchema = z
  .object({
    cityId: z.string().min(1, "City ID is required.").regex(/^\d+$/, "Enter a valid city ID."),
    arrivalDate: z.string().min(1, "Arrival date is required."),
    departureDate: z.string().min(1, "Departure date is required."),
  })
  .refine((values) => values.departureDate >= values.arrivalDate, {
    message: "Departure cannot be before arrival.",
    path: ["departureDate"],
  });

type StopFormValues = z.infer<typeof stopFormSchema>;

export function TripDetailsPage() {
  const { tripId } = useParams();
  const location = useLocation();
  const numericTripId = Number(tripId);
  const notice =
    location.state && typeof location.state === "object" && "notice" in location.state
      ? String((location.state as { notice?: string }).notice ?? "")
      : "";

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TripActivity | null>(null);
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TripActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isInteger(numericTripId) || numericTripId <= 0) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    setNotFound(false);
    try {
      const [tripResult, stopResult, activityResult] = await Promise.all([
        getTripById(numericTripId),
        getTripStops(numericTripId),
        getTripActivities(numericTripId),
      ]);
      setTrip(tripResult);
      setStops(stopResult);
      setActivities(activityResult);
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message.toLowerCase().includes("not found")) {
        setNotFound(true);
      } else {
        setError(message || "Unable to load this trip.");
      }
      setTrip(null);
    } finally {
      setIsLoading(false);
    }
  }, [numericTripId]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    if (!trip) {
      return [];
    }
    return listTripDays(String(trip.start_date), String(trip.end_date));
  }, [trip]);

  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, TripActivity[]>();
    for (const activity of activities) {
      const key = String(activity.activity_date);
      const list = grouped.get(key) ?? [];
      list.push(activity);
      grouped.set(key, list);
    }
    return grouped;
  }, [activities]);

  const activityForm = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityName: "",
      location: "",
      tripStopId: "",
      activityId: "",
      activityDate: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  const stopForm = useForm<StopFormValues>({
    resolver: zodResolver(stopFormSchema),
    defaultValues: {
      cityId: "",
      arrivalDate: "",
      departureDate: "",
    },
  });

  function openCreate(date: string) {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
    activityForm.reset({
      activityName: "",
      location: "",
      tripStopId: stops[0] ? String(stops[0].id) : "",
      activityId: "",
      activityDate: date,
      startTime: "",
      endTime: "",
      notes: "",
    });
  }

  function openEdit(activity: TripActivity) {
    setEditing(activity);
    setFormError("");
    setFormOpen(true);
    activityForm.reset({
      activityName: activity.activity_name ?? "",
      location: activity.city_name ?? "",
      tripStopId: String(activity.trip_stop_id),
      activityId: String(activity.activity_id),
      activityDate: String(activity.activity_date),
      startTime: toTimeInput(activity.start_time),
      endTime: toTimeInput(activity.end_time),
      notes: activity.notes ?? "",
    });
  }

  useEffect(() => {
    if (trip && stops.length === 0) {
      stopForm.reset({
        cityId: "",
        arrivalDate: String(trip.start_date),
        departureDate: String(trip.end_date),
      });
    }
  }, [trip, stops.length, stopForm]);

  async function onSaveActivity(values: ActivityFormValues) {
    if (!trip) {
      return;
    }
    if (days.length > 0 && !days.includes(values.activityDate)) {
      activityForm.setError("activityDate", {
        message: "Activity date must fall within the trip dates.",
      });
      return;
    }

    setFormError("");
    const payload = {
      tripStopId: Number(values.tripStopId),
      activityId: Number(values.activityId),
      activityDate: values.activityDate,
      ...(values.startTime ? { startTime: values.startTime } : {}),
      ...(values.endTime ? { endTime: values.endTime } : {}),
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
      status: TripActivityStatus.PLANNED,
      estimatedCost: 0,
    };

    try {
      if (editing) {
        await updateTripActivity(trip.id, editing.id, payload);
      } else {
        await createTripActivity(trip.id, payload);
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err) || "Unable to save this activity.");
    }
  }

  async function onCreateStop(values: StopFormValues) {
    if (!trip) {
      return;
    }
    setFormError("");
    try {
      await createTripStop(trip.id, {
        cityId: Number(values.cityId),
        arrivalDate: values.arrivalDate,
        departureDate: values.departureDate,
      });
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err) || "Unable to add destination.");
    }
  }

  async function confirmDelete() {
    if (!trip || !pendingDelete || isDeleting) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteTripActivity(trip.id, pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err) || "Unable to delete this activity.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <TripDetailsSkeleton />;
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-gray-800">Trip not found.</h1>
        <p className="mt-2 text-sm text-gray-500">This trip may not exist, or you may not have access to it.</p>
        <Link to="/trips" className="mt-6 inline-flex rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white">
          Back to My Trips
        </Link>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-gray-800">Unable to load this trip.</h1>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={() => {
            void load();
          }}
          className="mt-6 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  const destinationNames = [...new Set(stops.map((stop) => stop.city_name).filter(Boolean))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm text-muted">
        <Link to="/trips" className="text-brand hover:underline">
          ← My Trips
        </Link>
      </p>
      {notice ? (
        <div className="mt-4">
          <SuccessMessage message={notice} />
        </div>
      ) : null}

      <header className="relative mt-3 overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-10">
        <div className="absolute inset-0" style={tripCoverStyle(trip.name)} />
        <div className="trip-cover-texture absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">{trip.name}</h1>
            {destinationNames.length > 0 ? (
              <p className="mt-2 text-sm text-white/85">{destinationNames.join(" · ")}</p>
            ) : (
              <p className="mt-2 text-sm text-white/70">No destinations added yet.</p>
            )}
            <p className="mt-2 text-sm text-white/80">
              {formatDateRange(String(trip.start_date), String(trip.end_date))} · {days.length}{" "}
              {days.length === 1 ? "day" : "days"}
            </p>
          </div>
          <Link
            to={`/trips/${trip.id}/edit`}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-ink"
          >
            Edit trip
          </Link>
        </div>
      </header>

      {formError ? <div className="mt-4"><ErrorMessage message={formError} /></div> : null}

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile
          label="Destinations"
          value={String(stops.length)}
          hint={destinationNames.length > 0 ? destinationNames.join(" · ") : "None added yet"}
        />
        <SummaryTile label="Duration" value={`${countTripDays(String(trip.start_date), String(trip.end_date))} days`} />
        <SummaryTile
          label="Budget"
          value={trip.budget != null ? `₹${Number(trip.budget).toLocaleString("en-IN")}` : "—"}
        />
      </section>

      {stops.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Destinations</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {stops.map((stop) => (
              <li
                key={stop.id}
                className="rounded-lg bg-white px-3 py-2 text-sm text-ink ring-1 ring-line"
              >
                {stop.city_name || `City ${stop.city_id}`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stops.length === 0 ? (
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-line">
          <h2 className="font-display text-xl font-semibold text-ink">Add a destination</h2>
          <p className="mt-2 text-sm text-gray-500">
            Activities must belong to a trip stop. There is no city search API yet, so enter a city ID from the seeded
            cities table.
          </p>
          <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3" onSubmit={stopForm.handleSubmit(onCreateStop)} noValidate>
            <AuthField label="City ID" inputMode="numeric" error={stopForm.formState.errors.cityId?.message} {...stopForm.register("cityId")} />
            <AuthField label="Arrival" type="date" error={stopForm.formState.errors.arrivalDate?.message} {...stopForm.register("arrivalDate")} />
            <AuthField label="Departure" type="date" error={stopForm.formState.errors.departureDate?.message} {...stopForm.register("departureDate")} />
            <div className="sm:col-span-3">
              <Button type="submit" isLoading={stopForm.formState.isSubmitting} className="sm:w-48">
                Save destination
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="mt-8 lg:max-w-3xl">
        <h2 className="font-display text-2xl font-semibold text-ink">Itinerary</h2>
        <p className="mt-1 text-sm text-muted">Where you need to be, and when.</p>
        <div className="mt-4 space-y-4">
        {days.map((date, index) => {
          const dayActivities = activitiesByDate.get(date) ?? [];
          return (
            <section key={date} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-line">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">Day {index + 1}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-ink">{formatDayStamp(date)}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => openCreate(date)}
                  disabled={stops.length === 0}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition duration-150 hover:bg-brand-dark disabled:opacity-50"
                >
                  Add Activity
                </button>
              </div>

              {dayActivities.length === 0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5">
                  <p className="text-sm font-medium text-ink">No plans for this day yet.</p>
                  <p className="mt-1 text-sm text-muted">Start building your itinerary.</p>
                </div>
              ) : (
                <ul className="relative mt-5 before:absolute before:top-2 before:bottom-3 before:left-[4.35rem] before:w-px before:bg-line">
                  {dayActivities.map((activity) => (
                    <li key={activity.id} className="relative flex gap-4 py-3 first:pt-0">
                      <div className="w-14 shrink-0 pt-0.5 text-xs font-semibold text-brand">
                        {toTimeInput(activity.start_time) || "—"}
                      </div>
                      <span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand ring-4 ring-white" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">
                          {activity.activity_name || `Activity #${activity.activity_id}`}
                        </p>
                        {activity.city_name ? <p className="mt-0.5 text-sm text-muted">{activity.city_name}</p> : null}
                        {activity.notes ? <p className="mt-1 text-sm text-slate-600">{activity.notes}</p> : null}
                        <div className="mt-2 flex gap-3">
                          <button type="button" className="text-sm font-medium text-brand" onClick={() => openEdit(activity)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600"
                            onClick={() => setPendingDelete(activity)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        </div>
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[var(--shadow-hover)]" role="dialog" aria-modal="true">
            <h2 className="font-display text-xl font-semibold text-ink">{editing ? "Edit activity" : "Add activity"}</h2>
            <p className="mt-2 text-xs text-muted">
              Activities are stored against a trip stop and a catalog activity ID. Name/location labels are for your
              reference; persistence uses stop + catalog IDs.
            </p>
            <form className="mt-4 space-y-3" onSubmit={activityForm.handleSubmit(onSaveActivity)} noValidate>
              <AuthField label="Activity name" error={activityForm.formState.errors.activityName?.message} {...activityForm.register("activityName")} />
              <AuthField label="Location" error={activityForm.formState.errors.location?.message} {...activityForm.register("location")} />
              <div>
                <label className="mb-1 block text-xs text-gray-500" htmlFor="tripStopId">
                  Destination / stop
                </label>
                <select
                  id="tripStopId"
                  className="h-11 w-full rounded-xl border border-brand-soft px-3 text-sm"
                  {...activityForm.register("tripStopId")}
                >
                  <option value="">Select a stop</option>
                  {stops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.city_name || `City ${stop.city_id}`} ({stop.arrival_date} – {stop.departure_date})
                    </option>
                  ))}
                </select>
                {activityForm.formState.errors.tripStopId ? (
                  <p className="mt-1 text-xs text-red-500">{activityForm.formState.errors.tripStopId.message}</p>
                ) : null}
              </div>
              <AuthField
                label="Catalog activity ID"
                inputMode="numeric"
                error={activityForm.formState.errors.activityId?.message}
                {...activityForm.register("activityId")}
              />
              <AuthField label="Date" type="date" error={activityForm.formState.errors.activityDate?.message} {...activityForm.register("activityDate")} />
              <div className="grid grid-cols-2 gap-3">
                <AuthField label="Start time" type="time" error={activityForm.formState.errors.startTime?.message} {...activityForm.register("startTime")} />
                <AuthField label="End time" type="time" error={activityForm.formState.errors.endTime?.message} {...activityForm.register("endTime")} />
              </div>
              <AuthTextArea label="Notes" rows={3} {...activityForm.register("notes")} />
              {formError ? <ErrorMessage message={formError} /> : null}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
                  onClick={() => {
                    setFormOpen(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={activityForm.formState.isSubmitting} className="w-36">
                  {editing ? "Save" : "Add Activity"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-hover)]" role="dialog" aria-modal="true">
            <h2 className="font-display text-xl font-semibold text-ink">Delete this activity?</h2>
            <p className="mt-2 text-sm text-muted">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  void confirmDelete();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 line-clamp-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
