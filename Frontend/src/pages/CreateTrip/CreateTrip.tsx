import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField, AuthTextArea } from "@/components/Input/AuthField";
import { SearchIcon } from "@/components/Input/icons";
import { Loader } from "@/components/Loader/Loader";
import type { CatalogActivity, CatalogCity } from "@/contracts/api";
import { searchActivities, searchCities } from "@/services/catalogApi";
import { createTripStop } from "@/services/itineraryApi";
import { createTrip, getTripById, updateTrip } from "@/services/tripApi";
import { TripVisibility } from "@/types/enums";
import type { CreateTripRequest } from "@/types/trip";
import { getApiErrorMessage } from "@/utils/apiError";
import { tripCoverStyle } from "@/utils/tripVisual";

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
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CatalogCity | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [cityResults, setCityResults] = useState<CatalogCity[]>([]);
  const [suggestedCities, setSuggestedCities] = useState<CatalogCity[]>([]);
  const [suggestedActivities, setSuggestedActivities] = useState<CatalogActivity[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [placeOpen, setPlaceOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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

  const startDate = watch("startDate");
  const endDate = watch("endDate");

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
        setNameTouched(true);
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

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError("");

    searchCities()
      .then((cities) => {
        if (!cancelled) {
          setSuggestedCities(cities.slice(0, 6));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setCatalogError(getApiErrorMessage(error) || "Unable to load place suggestions.");
        }
      });

    searchActivities()
      .then((activities) => {
        if (!cancelled) {
          setSuggestedActivities(activities.slice(0, 6));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestedActivities([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const query = selectedCity && placeQuery === selectedCity.name ? "" : placeQuery;
      searchCities(query)
        .then((cities) => {
          setCityResults(cities.slice(0, 8));
          if (query) {
            setSuggestedCities(cities.slice(0, 6));
          }
        })
        .catch(() => {
          setCityResults([]);
        });
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [placeQuery, selectedCity]);

  function selectCity(city: CatalogCity) {
    setSelectedCity(city);
    setPlaceQuery(city.name);
    setPlaceOpen(false);
    if (!nameTouched) {
      setValue("name", city.name, { shouldValidate: true });
    }
  }

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
      if (selectedCity) {
        try {
          await createTripStop(trip.id, {
            cityId: selectedCity.id,
            arrivalDate: values.startDate,
            departureDate: values.endDate,
          });
        } catch {
          /* Trip exists; destination can be added on the trip page. */
        }
      }
      navigate(`/trips/${trip.id}`, { replace: true, state: { notice: "Trip created successfully." } });
    } catch (error) {
      setFormError(
        getApiErrorMessage(error) ||
          (isEdit ? "Unable to update your trip. Please try again." : "Unable to create your trip. Please try again."),
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm text-muted">
        <Link to="/trips" className="text-brand hover:underline">
          My Trips
        </Link>
        <span>{isEdit ? " / Edit trip" : " / Create trip"}</span>
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
        {isEdit ? "Edit your trip" : "Plan a new trip"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isEdit
          ? "Update the trip details. Cities, stops, and activities are managed later."
          : "Choose dates and a place. Suggestions below come from the city and activity catalog."}
      </p>

      {isLoadingTrip ? <Loader label="Loading trip..." /> : null}

      {!isLoadingTrip ? (
        <form className="mt-8 space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
          <section className="space-y-5 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-line sm:p-8">
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="place-search">
                Select a place
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
                  <SearchIcon />
                </span>
                <input
                  id="place-search"
                  type="search"
                  value={placeQuery}
                  onChange={(event) => {
                    setPlaceQuery(event.target.value);
                    setSelectedCity(null);
                    setPlaceOpen(true);
                  }}
                  onFocus={() => setPlaceOpen(true)}
                  placeholder="Search cities, e.g. Goa"
                  className="h-11 w-full rounded-xl border border-line bg-white pr-4 pl-10 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  autoComplete="off"
                />
                {placeOpen && cityResults.length > 0 ? (
                  <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl bg-white py-1 shadow-[var(--shadow-hover)] ring-1 ring-line">
                    {cityResults.map((city) => (
                      <li key={city.id}>
                        <button
                          type="button"
                          className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-brand-wash"
                          onClick={() => selectCity(city)}
                        >
                          <span className="text-sm font-medium text-ink">{city.name}</span>
                          <span className="text-xs text-muted">
                            {city.country_name || city.short_description || city.slug}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {selectedCity ? (
                <p className="mt-2 text-sm text-muted">
                  Selected: <span className="font-medium text-ink">{selectedCity.name}</span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">Optional. Selecting a place adds it as the first destination.</p>
              )}
            </div>

            <AuthField
              label="Trip Name"
              placeholder="Summer in Japan"
              error={errors.name?.message}
              {...register("name", {
                onChange: () => setNameTouched(true),
              })}
            />

            <AuthTextArea
              label="Description"
              rows={3}
              placeholder="What is this trip about?"
              error={errors.description?.message}
              {...register("description")}
            />

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
          </section>

          {!isEdit ? (
            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Suggestions for places to visit / activities
              </h2>
              <p className="mt-1 text-sm text-muted">
                {selectedCity
                  ? `Places and activities related to ${selectedCity.name}.`
                  : "Pick a place to plan around, or browse activities."}
              </p>

              {catalogLoading ? <Loader label="Loading suggestions..." /> : null}
              {catalogError ? (
                <div className="mt-4">
                  <ErrorMessage message={catalogError} />
                </div>
              ) : null}

              {!catalogLoading && !catalogError ? (
                <div className="mt-5 space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">Places</h3>
                    {suggestedCities.length === 0 ? (
                      <p className="mt-3 text-sm text-muted">No places match that search.</p>
                    ) : (
                      <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {suggestedCities.map((city) => (
                          <li key={city.id}>
                            <SuggestionCard
                              title={city.name}
                              subtitle={city.short_description || city.country_name || "Destination"}
                              imageUrl={city.image_url}
                              selected={selectedCity?.id === city.id}
                              onClick={() => selectCity(city)}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">Activities</h3>
                    {suggestedActivities.length === 0 ? (
                      <p className="mt-3 text-sm text-muted">No activities found yet.</p>
                    ) : (
                      <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {suggestedActivities.map((activity) => (
                          <li key={activity.id}>
                            <SuggestionCard
                              title={activity.name}
                              subtitle={
                                activity.category_name ||
                                activity.description ||
                                (activity.is_free ? "Free" : "Activity")
                              }
                              meta={activityMeta(activity)}
                              imageUrl={activity.image_url}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
              {!isEdit && startDate && endDate ? (
                <p className="mt-4 text-xs text-muted">
                  Dates {startDate} – {endDate} will be used if you add the selected place as a stop.
                </p>
              ) : null}
            </section>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function activityMeta(activity: CatalogActivity): string | undefined {
  const parts: string[] = [];
  if (activity.duration_minutes) {
    parts.push(`${activity.duration_minutes} min`);
  }
  if (activity.is_free) {
    parts.push("Free");
  } else if (activity.estimated_cost != null) {
    parts.push(`${activity.currency || "INR"} ${activity.estimated_cost}`);
  }
  if (activity.rating != null) {
    parts.push(`${activity.rating}★`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function SuggestionCard({
  title,
  subtitle,
  meta,
  imageUrl,
  selected = false,
  onClick,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  imageUrl?: string | null;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="relative h-36 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={tripCoverStyle(title)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
      </div>
      <div className="p-3">
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{subtitle}</p>
        {meta ? <p className="mt-1 text-xs text-muted">{meta}</p> : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full overflow-hidden rounded-2xl bg-white text-left shadow-[var(--shadow-card)] ring-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] ${
          selected ? "ring-2 ring-brand" : "ring-line"
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-line">
      {content}
    </article>
  );
}
