import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { Loader } from "@/components/Loader/Loader";
import { TripCard } from "@/components/TripCard/TripCard";
import { deleteTrip, getTrips } from "@/services/tripApi";
import type { Trip } from "@/types/trip";
import { getApiErrorMessage } from "@/utils/apiError";

export function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getTrips();
      setTrips(result);
    } catch (error) {
      setTrips([]);
      setError(getApiErrorMessage(error) || "Unable to load your trips.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  async function confirmDelete() {
    if (!pendingDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteTrip(pendingDelete.id);
      setTrips((current) => current.filter((trip) => trip.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error) || "Unable to delete this trip. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">My Trips</h1>
          <p className="mt-2 text-sm text-gray-500">View and manage the trips you have created.</p>
        </div>
        <Link
          to="/trips/create"
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Plan New Trip
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? <Loader label="Loading your trips..." /> : null}

        {!isLoading && error ? (
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

        {!isLoading && !error && trips.length === 0 ? (
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

        {!isLoading && !error && trips.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={setPendingDelete}
                isDeleting={isDeleting && pendingDelete?.id === trip.id}
              />
            ))}
          </div>
        ) : null}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="text-lg font-semibold text-gray-800">Delete this trip?</h2>
            <p className="mt-2 text-sm text-gray-500">
              “{pendingDelete.name}” will be permanently deleted. This cannot be undone.
            </p>
            {deleteError ? <div className="mt-4"><ErrorMessage message={deleteError} /></div> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteError("");
                }}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  void confirmDelete();
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete Trip"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
