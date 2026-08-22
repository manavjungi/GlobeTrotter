import { Link } from "react-router-dom";
import type { Trip } from "@/types/trip";
import { formatDateRange } from "@/utils/date";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-soft/60 bg-white shadow-sm">
      {trip.cover_image ? (
        <img src={trip.cover_image} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="h-24 bg-brand" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800">{trip.name}</h3>
          {trip.status ? (
            <span className="rounded-full bg-brand-wash px-2 py-0.5 text-[11px] font-medium tracking-wide text-brand uppercase">
              {trip.status}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-gray-500">{formatDateRange(trip.start_date, trip.end_date)}</p>
        {trip.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">{trip.description}</p>
        ) : null}
        <Link
          to={`/trips/${trip.id}`}
          className="mt-4 text-sm font-medium text-brand hover:underline"
        >
          View Trip
        </Link>
      </div>
    </article>
  );
}
