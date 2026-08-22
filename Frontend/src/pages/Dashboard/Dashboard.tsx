import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/auth/hero.png";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { SearchIcon } from "@/components/Input/icons";
import { TripCardSkeleton } from "@/components/Loader/Loader";
import { TripCard } from "@/components/TripCard/TripCard";
import { TripBudgetCard } from "@/components/Budget/TripBudgetCard";
import { REGIONAL_DESTINATIONS, type RegionalCity } from "@/data/regions";
import { useAuth } from "@/hooks/useAuth";
import { getTripBudget } from "@/services/expenseApi";
import { getTrips } from "@/services/tripApi";
import type { TripBudget } from "@/contracts/api";
import type { Trip } from "@/types/trip";
import { getApiErrorMessage } from "@/utils/apiError";
import { countTripDays, formatDateRange } from "@/utils/date";
import { tripCoverPhoto } from "@/utils/tripVisual";

type CatalogFilter = "all" | "featured" | "upcoming" | "past";
type CatalogSort = "name" | "popularity" | "soonest" | "latest";
type CatalogGroup = "none" | "featured" | "month";

export function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [sortBy, setSortBy] = useState<CatalogSort>("popularity");
  const [groupBy, setGroupBy] = useState<CatalogGroup>("none");
  const [nextTripBudget, setNextTripBudget] = useState<TripBudget | null>(null);

  const loadTrips = useCallback(async () => {
    setTripsLoading(true);
    setTripsError("");
    try {
      const result = await getTrips();
      setTrips(result);
    } catch (error) {
      setTrips([]);
      setTripsError(getApiErrorMessage(error) || "Unable to load your trips. Please try again.");
    } finally {
      setTripsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const displayName = user?.first_name || user?.username || "traveler";

  const upcomingTrips = useMemo(() => {
    const now = Date.now();
    return [...trips]
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .filter((trip) => {
        const end = new Date(trip.end_date).getTime();
        return Number.isNaN(end) || end >= now;
      });
  }, [trips]);

  const nextTrip = upcomingTrips[0] ?? trips[0];
  const budgetTotal = trips.reduce((sum, trip) => sum + (trip.budget ?? 0), 0);
  const hasBudgetData = trips.some((trip) => trip.budget != null);

  useEffect(() => {
    if (!nextTrip) {
      setNextTripBudget(null);
      return;
    }
    let cancelled = false;
    getTripBudget(nextTrip.id)
      .then((result) => {
        if (!cancelled) {
          setNextTripBudget(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNextTripBudget(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nextTrip?.id]);

  const filteredCities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = REGIONAL_DESTINATIONS.filter((city) => {
      if (filter === "featured" && !city.featured) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = `${city.name} ${city.state} ${city.description} ${city.highlights}`.toLowerCase();
      return haystack.includes(needle);
    });

    return matched.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return b.popularity - a.popularity;
    });
  }, [query, filter, sortBy]);

  const groupedCities = useMemo(() => {
    if (groupBy !== "featured") {
      return [{ key: "all", label: "", cities: filteredCities }];
    }

    const featured = filteredCities.filter((city) => city.featured);
    const more = filteredCities.filter((city) => !city.featured);
    return [
      { key: "featured", label: "Featured", cities: featured },
      { key: "more", label: "More destinations", cities: more },
    ].filter((group) => group.cities.length > 0);
  }, [filteredCities, groupBy]);

  const filteredTrips = useMemo(() => {
    const now = Date.now();
    const needle = query.trim().toLowerCase();

    const matched = trips.filter((trip) => {
      const end = new Date(trip.end_date).getTime();
      const isPast = !Number.isNaN(end) && end < now;
      if (filter === "upcoming" && isPast) {
        return false;
      }
      if (filter === "past" && !isPast) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = `${trip.name} ${trip.description ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });

    return matched.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      const delta = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      return sortBy === "latest" ? -delta : delta;
    });
  }, [trips, query, filter, sortBy]);

  const groupedTrips = useMemo(() => {
    if (groupBy !== "month") {
      return [{ key: "all", label: "", trips: filteredTrips }];
    }

    const groups = new Map<string, Trip[]>();
    for (const trip of filteredTrips) {
      const key = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
        new Date(trip.start_date),
      );
      const list = groups.get(key) ?? [];
      list.push(trip);
      groups.set(key, list);
    }

    return [...groups.entries()].map(([key, groupTrips]) => ({
      key,
      label: key,
      trips: groupTrips,
    }));
  }, [filteredTrips, groupBy]);

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl text-white">
        <img
          src={heroBanner}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/55 to-ink/20" />
        <div className="relative flex min-h-56 flex-col justify-end gap-6 px-6 py-10 sm:min-h-72 sm:flex-row sm:items-end sm:justify-between sm:px-10">
          <div>
            <p className="text-sm text-white/70">Welcome back, {displayName}</p>
            <h1 className="mt-2 max-w-lg font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Where are you going next?
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
              Plan routes, keep dates in one place, and build your itinerary as you go.
            </p>
          </div>
          <Link
            to="/trips/create"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-ink transition duration-150 hover:bg-brand-wash"
          >
            Plan New Trip
          </Link>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search destinations and trips</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your trips"
            className="h-11 w-full rounded-full border border-brand-soft bg-white pr-4 pl-11 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <ToolbarSelect
            label="Group by"
            value={groupBy}
            onChange={(value) => setGroupBy(value as CatalogGroup)}
            options={[
              { value: "none", label: "No grouping" },
              { value: "featured", label: "Featured" },
              { value: "month", label: "Month" },
            ]}
          />
          <ToolbarSelect
            label="Filter"
            value={filter}
            onChange={(value) => setFilter(value as CatalogFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "featured", label: "Featured" },
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
            ]}
          />
          <ToolbarSelect
            label="Sort by"
            value={sortBy}
            onChange={(value) => setSortBy(value as CatalogSort)}
            options={[
              { value: "popularity", label: "Popularity" },
              { value: "name", label: "Name" },
              { value: "soonest", label: "Soonest" },
              { value: "latest", label: "Latest" },
            ]}
          />
        </div>
      </div>

      <section className="mt-10">
        <SectionHeading title="Top Regional Selection" />
        <p className="mt-1 text-sm text-muted">Gujarat destinations from the city catalog.</p>
        {filteredCities.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No destinations match that search or filter.</p>
        ) : (
          groupedCities.map((group) => (
            <div key={group.key} className="mt-4">
              {group.label ? (
                <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  {group.label}
                </p>
              ) : null}
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {group.cities.map((city) => (
                  <RegionalCard
                    key={city.id}
                    city={city}
                    isActive={query.trim().toLowerCase() === city.name.toLowerCase()}
                    onSelect={() =>
                      setQuery((current) =>
                        current.trim().toLowerCase() === city.name.toLowerCase() ? "" : city.name,
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {!tripsLoading && !tripsError && nextTrip ? (
        <section className="mt-10 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative min-h-52 overflow-hidden">
              <img
                src={tripCoverPhoto(nextTrip.name)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/70 to-ink/10" />
              <p className="absolute top-5 left-5 text-[11px] font-semibold tracking-[0.16em] text-white/80 uppercase">
                Your next adventure
              </p>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <h2 className="font-display text-3xl font-semibold text-ink">{nextTrip.name}</h2>
              <p className="mt-2 text-sm text-muted">{formatDateRange(nextTrip.start_date, nextTrip.end_date)}</p>
              <p className="mt-1 text-sm text-muted">
                {countTripDays(nextTrip.start_date, nextTrip.end_date)} days · {nextTrip.stop_count ?? 0} destinations
              </p>
              {nextTripBudget ? (
                <div className="mt-5">
                  <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Budget</p>
                  <p className="mt-1 text-sm text-ink">
                    {`₹${nextTripBudget.actual.total.toLocaleString("en-IN")} / ₹${nextTripBudget.allocatedBudget.toLocaleString("en-IN")}`}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${
                          nextTripBudget.allocatedBudget > 0
                            ? Math.min((nextTripBudget.actual.total / nextTripBudget.allocatedBudget) * 100, 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    ₹{nextTripBudget.remaining.actual.toLocaleString("en-IN")} remaining
                  </p>
                </div>
              ) : null}
              <Link
                to={`/trips/${nextTrip.id}`}
                className="mt-5 inline-flex w-fit text-sm font-semibold text-brand hover:text-brand-dark"
              >
                Open itinerary →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {trips.length > 0 ? (
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <HighlightCard label="Trips planned" value={String(trips.length)} />
          <HighlightCard
            label="Next trip"
            value={nextTrip ? nextTrip.name : "None"}
            hint={nextTrip ? formatDateRange(nextTrip.start_date, nextTrip.end_date) : undefined}
          />
          {nextTripBudget ? (
            <TripBudgetCard budget={nextTripBudget} compact />
          ) : hasBudgetData ? (
            <HighlightCard label="Planned budget" value={`₹${budgetTotal.toLocaleString("en-IN")}`} />
          ) : (
            <HighlightCard label="Planned budget" value="—" hint="Shown when a trip has a budget." />
          )}
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <SectionHeading title="Previous Trips" />
          <Link to="/trips" className="shrink-0 text-sm font-medium text-brand hover:text-brand-dark">
            View all
          </Link>
        </div>

        {tripsLoading ? (
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
            <div className="w-[250px] shrink-0">
              <TripCardSkeleton />
            </div>
            <div className="w-[250px] shrink-0">
              <TripCardSkeleton />
            </div>
            <div className="w-[250px] shrink-0">
              <TripCardSkeleton />
            </div>
          </div>
        ) : null}

        {!tripsLoading && tripsError ? (
          <div className="space-y-3">
            <ErrorMessage message="We couldn't load your trips." />
            <button type="button" onClick={() => void loadTrips()} className="text-sm font-medium text-brand">
              Try again
            </button>
          </div>
        ) : null}

        {!tripsLoading && !tripsError && trips.length === 0 ? (
          <EmptyState
            title="No adventures yet"
            description="Start planning your next trip and it will show up here."
            action={
              <Link
                to="/trips/create"
                className="inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Plan New Trip
              </Link>
            }
          />
        ) : null}

        {!tripsLoading && !tripsError && trips.length > 0 && filteredTrips.length === 0 ? (
          <EmptyState
            title="No matching trips"
            description="Try another search, filter, or regional place."
          />
        ) : null}

        {!tripsLoading && !tripsError && filteredTrips.length > 0
          ? groupedTrips.map((group) => (
              <div key={group.key} className="mt-4 first:mt-0">
                {group.label ? (
                  <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    {group.label}
                  </p>
                ) : null}
                <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
                  {group.trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} layout="portrait" />
                  ))}
                </div>
              </div>
            ))
          : null}
      </section>

      <Link
        to="/trips/create"
        className="fixed right-4 bottom-5 z-20 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-[var(--shadow-hover)] transition duration-150 hover:bg-brand-dark sm:right-8"
      >
        <span aria-hidden="true">+</span>
        Plan a trip
      </Link>
    </div>
  );
}

function RegionalCard({
  city,
  isActive,
  onSelect,
}: {
  city: RegionalCity;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={city.highlights}
      className={`group relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl text-left ring-1 transition duration-200 hover:-translate-y-0.5 ${
        isActive ? "ring-2 ring-brand" : "ring-line"
      }`}
    >
      <img
        src={city.image || tripCoverPhoto(city.name, city.slug)}
        alt=""
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" />
      {city.featured ? (
        <span className="absolute top-2 right-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink uppercase">
          Featured
        </span>
      ) : null}
      <span className="absolute right-3 bottom-3 left-3">
        <span className="block font-display text-base font-semibold text-white">{city.name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-white/80">{city.highlights}</span>
      </span>
    </button>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <h2 className="shrink-0 font-display text-2xl font-semibold text-ink">{title}</h2>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

function ToolbarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-ink">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent font-medium outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function HighlightCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
