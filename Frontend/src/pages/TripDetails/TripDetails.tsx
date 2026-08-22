import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField, AuthTextArea } from "@/components/Input/AuthField";
import { Loader } from "@/components/Loader/Loader";
import type { Trip, TripActivity, TripStop } from "@/contracts/api";
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
import { formatDateRange, formatLongDate, formatTimeRange, listTripDays, toTimeInput } from "@/utils/date";

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
  const numericTripId = Number(tripId);

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
      status: "planned",
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
    return <Loader label="Loading trip..." />;
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-brand">
        <Link to="/trips" className="hover:underline">
          My Trips
        </Link>
        <span className="text-gray-400"> / Trip details</span>
      </p>

      <header className="mt-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-soft/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">{trip.name}</h1>
            <p className="mt-2 text-sm text-gray-500">{formatDateRange(String(trip.start_date), String(trip.end_date))}</p>
            {destinationNames.length > 0 ? (
              <p className="mt-1 text-sm text-gray-500">{destinationNames.join(" · ")}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">No destinations added yet.</p>
            )}
            <p className="mt-2 text-sm text-gray-500">{days.length} {days.length === 1 ? "day" : "days"}</p>
            {trip.description ? <p className="mt-3 text-sm text-gray-600">{trip.description}</p> : null}
          </div>
          <Link
            to={`/trips/${trip.id}/edit`}
            className="inline-flex h-11 items-center justify-center rounded-md border border-brand-soft px-4 text-sm font-medium text-gray-700"
          >
            Edit trip
          </Link>
        </div>
      </header>

      {formError ? <div className="mt-4"><ErrorMessage message={formError} /></div> : null}

      {stops.length === 0 ? (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-soft/60">
          <h2 className="text-lg font-semibold text-gray-800">Add a destination</h2>
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

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Itinerary</h2>
        {days.map((date, index) => {
          const dayActivities = activitiesByDate.get(date) ?? [];
          return (
            <section key={date} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-soft/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Day {index + 1}</h3>
                  <p className="text-sm text-gray-500">{formatLongDate(date)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreate(date)}
                  disabled={stops.length === 0}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white disabled:opacity-50"
                >
                  Add Activity
                </button>
              </div>

              {dayActivities.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No activities planned for this day.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {dayActivities.map((activity) => (
                    <li key={activity.id} className="rounded-2xl border border-brand-soft/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {activity.activity_name || `Activity #${activity.activity_id}`}
                          </p>
                          {activity.city_name ? (
                            <p className="mt-1 text-sm text-gray-500">{activity.city_name}</p>
                          ) : null}
                          {formatTimeRange(activity.start_time, activity.end_time) ? (
                            <p className="mt-1 text-sm text-gray-500">
                              {formatTimeRange(activity.start_time, activity.end_time)}
                            </p>
                          ) : null}
                          {activity.notes ? <p className="mt-2 text-sm text-gray-600">{activity.notes}</p> : null}
                        </div>
                        <div className="flex gap-3">
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
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" role="dialog" aria-modal="true">
            <h2 className="text-lg font-semibold text-gray-800">{editing ? "Edit activity" : "Add activity"}</h2>
            <p className="mt-2 text-xs text-gray-500">
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
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm"
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
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6" role="dialog" aria-modal="true">
            <h2 className="text-lg font-semibold text-gray-800">Delete this activity?</h2>
            <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-200 px-4 py-2 text-sm"
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
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
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
