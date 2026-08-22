import { Link } from "react-router-dom";
import type { Trip } from "@/types/trip";
import { formatDateRange } from "@/utils/date";

interface TripCardProps {
  trip: Trip;
  onDelete?: (trip: Trip) => void;
  isDeleting?: boolean;
}

export function TripCard({ trip, onDelete, isDeleting = false }: TripCardProps) {
  const destinationLabel = `${trip.stop_count ?? 0} ${trip.stop_count === 1 ? "destination" : "destinations"}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-soft/60 bg-white shadow-sm">
      <div className="flex h-24 items-center justify-center bg-brand text-sm font-medium text-white">
        {trip.name}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800">{trip.name}</h3>
          {trip.visibility ? (
            <span className="rounded-full bg-brand-wash px-2 py-0.5 text-[11px] font-medium tracking-wide text-brand uppercase">
              {trip.visibility.replace("_", " ")}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-gray-500">{formatDateRange(trip.start_date, trip.end_date)}</p>
        {destinationLabel ? <p className="mt-1 text-sm text-gray-500">{destinationLabel}</p> : null}
        {trip.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">{trip.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={`/trips/${trip.id}`} className="text-sm font-medium text-brand hover:underline">
            View
          </Link>
          <Link to={`/trips/${trip.id}/edit`} className="text-sm font-medium text-gray-600 hover:underline">
            Edit
          </Link>
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(trip)}
              disabled={isDeleting}
              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
