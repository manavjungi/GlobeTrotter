import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField, AuthTextArea } from "@/components/Input/AuthField";
import { Loader } from "@/components/Loader/Loader";
import { createTrip, getTripById, updateTrip } from "@/services/tripApi";
import { TripVisibility } from "@/types/enums";
import type { CreateTripRequest } from "@/types/trip";
import { getApiErrorMessage } from "@/utils/apiError";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const createTripSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Trip name is required.")
      .max(200, "Trip name must be 200 characters or fewer."),
    startDate: z
      .string()
      .min(1, "Please select a start date.")
      .regex(isoDatePattern, "Please select a valid start date."),
    endDate: z
      .string()
      .min(1, "Please select an end date.")
      .regex(isoDatePattern, "Please select a valid end date."),
    description: z.string().max(5000, "Description must be 5000 characters or fewer."),
    budget: z.string(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "End date cannot be before start date.",
    path: ["endDate"],
  })
  .refine((values) => {
    const trimmed = values.budget.trim();
    if (trimmed === "") {
      return true;
    }
    const amount = Number(trimmed);
    return Number.isFinite(amount) && amount >= 0;
  }, {
    message: "Budget cannot be negative.",
    path: ["budget"],
  });

type CreateTripFormValues = z.infer<typeof createTripSchema>;

function toDateInputValue(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : "";
}

function asVisibility(value: string | null | undefined): TripVisibility {
  if (value === TripVisibility.LINK_ONLY || value === TripVisibility.PUBLIC || value === TripVisibility.PRIVATE) {
    return value;
  }
  return TripVisibility.PRIVATE;
}

export function CreateTripPage() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const isEdit = Boolean(tripId);
  const [formError, setFormError] = useState("");
  const [isLoadingTrip, setIsLoadingTrip] = useState(isEdit);
  const [existingVisibility, setExistingVisibility] = useState<TripVisibility>(TripVisibility.PRIVATE);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      budget: "",
    },
  });

  useEffect(() => {
    if (!tripId) {
      return;
    }

    const id = Number(tripId);
    if (!Number.isInteger(id)) {
      setFormError("Invalid trip ID.");
      setIsLoadingTrip(false);
      return;
    }

    setIsLoadingTrip(true);
    getTripById(id)
      .then((trip) => {
        setExistingVisibility(asVisibility(trip.visibility));
        reset({
          name: trip.name,
          startDate: toDateInputValue(trip.start_date),
          endDate: toDateInputValue(trip.end_date),
          description: trip.description ?? "",
          budget: trip.budget == null ? "" : String(trip.budget),
        });
      })
      .catch((error) => {
        setFormError(getApiErrorMessage(error) || "Unable to load this trip.");
      })
      .finally(() => {
        setIsLoadingTrip(false);
      });
  }, [tripId, reset]);

  async function onSubmit(values: CreateTripFormValues) {
    setFormError("");

    const trimmedBudget = values.budget.trim();
    const trimmedDescription = values.description.trim();

    try {
      const payload: CreateTripRequest = {
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        visibility: isEdit ? existingVisibility : TripVisibility.PRIVATE,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        ...(trimmedBudget === "" ? {} : { budget: Number(trimmedBudget) }),
      };

      if (isEdit && tripId) {
        await updateTrip(Number(tripId), payload);
        navigate("/trips", { replace: true, state: { notice: "Trip updated successfully." } });
        return;
      }

      const trip = await createTrip(payload);
      navigate(`/trips/${trip.id}`, { replace: true, state: { notice: "Trip created successfully." } });
    } catch (error) {
      setFormError(
        getApiErrorMessage(error) ||
          (isEdit ? "Unable to update your trip. Please try again." : "Unable to create your trip. Please try again."),
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <p className="text-sm text-muted">
        <Link to="/trips" className="text-brand hover:underline">
          My Trips
        </Link>
        <span>{isEdit ? " / Edit trip" : " / Create trip"}</span>
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
        {isEdit ? "Edit your trip" : "Create your trip"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isEdit
          ? "Update the trip details. Cities, stops, and activities are managed later."
          : "Start with the basics. You can build your itinerary next."}
      </p>
      {!isEdit ? (
        <ol className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted" aria-label="Planning progress">
          <li className="flex items-center gap-2 font-semibold text-brand">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] text-white">
              1
            </span>
            Trip details
          </li>
          <li aria-hidden="true">→</li>
          <li className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] text-ink">
              2
            </span>
            Destinations
          </li>
          <li aria-hidden="true">→</li>
          <li className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] text-ink">
              3
            </span>
            Itinerary
          </li>
        </ol>
      ) : null}

      {isLoadingTrip ? <Loader label="Loading trip..." /> : null}

      {!isLoadingTrip ? (
      <form
        className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-line sm:p-8"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Trip information</h2>
          <AuthField
            label="Trip Name"
            placeholder="Summer in Japan"
            error={errors.name?.message}
            {...register("name")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthField
              label="Start Date"
              type="date"
              error={errors.startDate?.message}
              {...register("startDate")}
            />
            <AuthField
              label="End Date"
              type="date"
              error={errors.endDate?.message}
              {...register("endDate")}
            />
          </div>
          <AuthTextArea
            label="Description"
            rows={4}
            placeholder="What is this trip about?"
            error={errors.description?.message}
            {...register("description")}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Budget</h2>
          <AuthField
            label="Budget Limit"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Optional"
            error={errors.budget?.message}
            {...register("budget")}
          />
        </section>

        {formError ? <ErrorMessage message={formError} /> : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/trips"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-6 text-sm font-medium text-ink hover:bg-slate-50"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={isSubmitting} className="sm:w-48">
            {isSubmitting ? (isEdit ? "Saving..." : "Creating trip...") : isEdit ? "Save Trip" : "Create Trip"}
          </Button>
        </div>
      </form>
      ) : null}
    </div>
  );
}
