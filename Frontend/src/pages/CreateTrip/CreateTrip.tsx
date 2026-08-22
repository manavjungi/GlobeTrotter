import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField, AuthTextArea } from "@/components/Input/AuthField";
import { SearchIcon } from "@/components/Input/icons";
import { Loader } from "@/components/Loader/Loader";
import type { CatalogActivity, CatalogCity } from "@/contracts/api";
import { REGIONAL_DESTINATIONS } from "@/data/regions";
import { searchActivities, searchCities } from "@/services/catalogApi";
import { createTripStop } from "@/services/itineraryApi";
import { createTrip, getTripById, updateTrip } from "@/services/tripApi";
import { TripVisibility } from "@/types/enums";
import type { CreateTripRequest } from "@/types/trip";
import { getApiErrorMessage } from "@/utils/apiError";
import { resolveCityPhoto } from "@/utils/cityPhoto";

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

  const fallbackCities = REGIONAL_DESTINATIONS.slice(0, 6).map((city) => ({
    id: city.id,
    name: city.name,
    slug: city.slug,
    short_description: city.highlights,
    image_url: city.image,
    country_name: city.state,
  }));
  const placeCards = suggestedCities.length > 0 ? suggestedCities.slice(0, 6) : fallbackCities;

  function pickPlace(city: { id: number; name: string }) {
    const match = suggestedCities.find((item) => item.id === city.id || item.name === city.name);
    if (match) {
      selectCity(match);
      return;
    }
    setPlaceQuery(city.name);
    setPlaceOpen(true);
    if (!nameTouched) {
      setValue("name", city.name, { shouldValidate: true });
    }
  }

  const cityCards = placeCards.slice(0, 4).map((city) => ({
    key: `city-${city.id}`,
    title: city.name,
    subtitle: city.short_description || city.country_name || "Place",
    photo: resolveCityPhoto(city.name, city.slug, city.image_url),
    onClick: () => pickPlace(city),
  }));
  const activityCards = suggestedActivities.slice(0, 2).map((activity) => ({
    key: `activity-${activity.id}`,
    title: activity.name,
    subtitle: activity.category_name || activity.description || "Activity",
    photo: resolveCityPhoto(activity.name, activity.slug, activity.image_url),
    onClick: undefined as (() => void) | undefined,
  }));
  const extraCities = placeCards.slice(cityCards.length).map((city) => ({
    key: `city-${city.id}`,
    title: city.name,
    subtitle: city.short_description || city.country_name || "Place",
    photo: resolveCityPhoto(city.name, city.slug, city.image_url),
    onClick: () => pickPlace(city),
  }));
  const suggestionCards = [...cityCards, ...activityCards, ...extraCities].slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <p className="text-sm text-muted">
        <Link to="/trips" className="text-brand hover:underline">
          My Trips
        </Link>
        <span>{isEdit ? " / Edit trip" : " / Create trip"}</span>
      </p>

      {isLoadingTrip ? <Loader label="Loading trip..." /> : null}

      {!isLoadingTrip ? (
        <form className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-line sm:p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {isEdit ? "Edit your trip" : "Plan a new trip"}
          </h1>

          <div className="mt-4 max-w-2xl space-y-2.5">
            <FormRow label="Start Date" htmlFor="startDate">
              <input
                id="startDate"
                type="date"
                className={inputClass}
                {...register("startDate")}
              />
              {errors.startDate ? <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p> : null}
            </FormRow>

            <FormRow label="Select a Place" htmlFor="place-search">
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
                  className={`${inputClass} pl-10`}
                  autoComplete="off"
                />
                {placeOpen && cityResults.length > 0 ? (
                  <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg bg-white py-1 shadow-[var(--shadow-hover)] ring-1 ring-line">
                    {cityResults.map((city) => (
                      <li key={city.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-wash"
                          onClick={() => selectCity(city)}
                        >
                          <img
                            src={resolveCityPhoto(city.name, city.slug, city.image_url)}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover"
                          />
                          <span>
                            <span className="block text-sm font-medium text-ink">{city.name}</span>
                            <span className="block text-xs text-muted">
                              {city.country_name || city.short_description || city.slug}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </FormRow>

            <FormRow label="Trip Name" htmlFor="trip-name">
              <input
                id="trip-name"
                placeholder="Summer in Japan"
                className={inputClass}
                {...register("name", {
                  onChange: () => setNameTouched(true),
                })}
              />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
            </FormRow>

            <FormRow label="End Date" htmlFor="endDate">
              <input
                id="endDate"
                type="date"
                className={inputClass}
                {...register("endDate")}
              />
              {errors.endDate ? <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p> : null}
            </FormRow>
          </div>

          <div className="mt-3 max-w-2xl grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AuthTextArea
              label="Description"
              rows={2}
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
          </div>

          {formError ? <div className="mt-3"><ErrorMessage message={formError} /></div> : null}

          <div className="mt-4 flex justify-end gap-3">
            <Link
              to="/trips"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-5 text-sm font-medium text-ink hover:bg-slate-50"
            >
              Cancel
            </Link>
            <Button type="submit" isLoading={isSubmitting} className="w-40">
              {isSubmitting ? (isEdit ? "Saving..." : "Creating trip...") : isEdit ? "Save Trip" : "Create Trip"}
            </Button>
          </div>

          {!isEdit ? (
            <section className="mt-6 border-t border-line pt-4">
              <h2 className="font-display text-xl font-semibold text-ink">
                Suggestion for Places to Visit / Activities
              </h2>
              {catalogError ? (
                <div className="mt-3">
                  <ErrorMessage message={catalogError} />
                </div>
              ) : null}
              {catalogLoading ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-slate-200" />
                  ))}
                </div>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {suggestionCards.map((card) => (
                    <li key={card.key}>
                      <SuggestionCard
                        title={card.title}
                        subtitle={card.subtitle}
                        photo={card.photo}
                        selected={selectedCity?.name === card.title}
                        onClick={card.onClick}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {startDate && endDate ? (
                <p className="mt-3 text-xs text-muted">
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

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

function FormRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

function SuggestionCard({
  title,
  subtitle,
  photo,
  selected = false,
  onClick,
}: {
  title: string;
  subtitle: string;
  photo: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-3">
        <span className="block font-display text-lg font-semibold text-white">{title}</span>
        <span className="mt-0.5 block line-clamp-1 text-xs text-white/80">{subtitle}</span>
      </span>
    </>
  );

  const className = `group relative aspect-[3/4] w-full overflow-hidden rounded-xl text-left ring-1 transition duration-200 hover:-translate-y-0.5 ${
    selected ? "ring-2 ring-brand" : "ring-line"
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
}
