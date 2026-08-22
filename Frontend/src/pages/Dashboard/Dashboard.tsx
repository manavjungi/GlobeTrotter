import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CityCard } from "@/components/CityCard/CityCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { Loader } from "@/components/Loader/Loader";
import { TripCard } from "@/components/TripCard/TripCard";
import { useAuth } from "@/hooks/useAuth";
import { getCities } from "@/services/cityApi";
import { getTrips } from "@/services/tripApi";
import type { City } from "@/types/city";
import type { Trip } from "@/types/trip";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDateRange } from "@/utils/date";

export function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [tripsError, setTripsError] = useState("");
  const [citiesError, setCitiesError] = useState("");

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

  const loadCities = useCallback(async () => {
    setCitiesLoading(true);
    setCitiesError("");
    try {
      const result = await getCities();
      setCities(result);
    } catch (error) {
      setCities([]);
      setCitiesError(getApiErrorMessage(error) || "Unable to load destinations.");
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
    void loadCities();
  }, [loadTrips, loadCities]);

  const displayName = user?.firstName || user?.username || "traveler";

  const upcomingTrips = useMemo(() => {
    const now = Date.now();
    return [...trips]
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .filter((trip) => {
        const end = new Date(trip.end_date).getTime();
        return Number.isNaN(end) || end >= now;
      });
  }, [trips]);

  const visibleTrips = upcomingTrips.length > 0 ? upcomingTrips : trips;

  const nextTrip = visibleTrips[0];
  const budgetTotal = trips.reduce((sum, trip) => sum + (trip.budget_limit ?? 0), 0);
  const hasBudgetData = trips.some((trip) => trip.budget_limit !== null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="flex flex-col gap-6 rounded-3xl bg-[linear-gradient(120deg,#009ee2_0%,#4fc3f7_100%)] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-sm text-white/80">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold">{displayName}</h1>
          <p className="mt-2 max-w-md text-sm text-white/85">
            Ready to plan your next adventure?
          </p>
        </div>
        <Link
          to="/trips/create"
          className="inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold tracking-wide text-brand uppercase"
        >
          Plan New Trip
        </Link>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-800">Your trips</h2>
          <Link to="/trips/create" className="text-sm font-medium text-brand hover:underline">
            Plan New Trip
          </Link>
        </div>

        {tripsLoading ? <Loader label="Loading your trips..." /> : null}

        {!tripsLoading && tripsError ? (
          <div className="space-y-3">
            <ErrorMessage message="Unable to load your trips. Please try again." />
            <button
              type="button"
              onClick={() => {
                void loadTrips();
              }}
              className="text-sm font-medium text-brand hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!tripsLoading && !tripsError && trips.length === 0 ? (
          <EmptyState
            title="No trips yet"
            description="Start planning your next adventure."
            action={
              <Link
                to="/trips/create"
                className="inline-flex rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Plan Your First Trip
              </Link>
            }
          />
        ) : null}

        {!tripsLoading && !tripsError && visibleTrips.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Popular destinations</h2>
        {citiesLoading ? <Loader label="Loading destinations..." /> : null}
        {!citiesLoading && citiesError ? (
          <p className="text-sm text-gray-500">
            Destinations will appear when city data is available from the backend.
          </p>
        ) : null}
        {!citiesLoading && !citiesError && cities.length === 0 ? (
          <EmptyState
            title="No destinations yet"
            description="Popular cities will show up here once the backend provides city data."
          />
        ) : null}
        {!citiesLoading && !citiesError && cities.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cities.slice(0, 8).map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        ) : null}
      </section>

      {trips.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Trip highlights</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <HighlightCard label="Trips" value={String(trips.length)} />
            <HighlightCard
              label="Next trip"
              value={nextTrip ? nextTrip.name : "None"}
              hint={nextTrip ? formatDateRange(nextTrip.start_date, nextTrip.end_date) : undefined}
            />
            {hasBudgetData ? (
              <HighlightCard label="Planned budget" value={`₹${budgetTotal.toLocaleString("en-IN")}`} />
            ) : (
              <HighlightCard
                label="Budget"
                value="—"
                hint="Budget totals appear when trip budget data is available."
              />
            )}
          </div>
        </section>
      ) : null}
    </div>
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
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-soft/50">
      <p className="text-xs tracking-wide text-gray-400 uppercase">{label}</p>
      <p className="mt-2 text-xl font-semibold text-gray-800">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}
