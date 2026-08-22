import { Link } from "react-router-dom";
import { CalendarIcon, PinIcon } from "@/components/Input/icons";
import type { Trip } from "@/types/trip";
import { countTripDays, formatDateRange } from "@/utils/date";
import { tripCoverPhoto } from "@/utils/tripVisual";

interface TripCardProps {
  trip: Trip;
  onDelete?: (trip: Trip) => void;
  isDeleting?: boolean;
  layout?: "default" | "portrait";
}

export function TripCard({ trip, onDelete, isDeleting = false, layout = "default" }: TripCardProps) {
  const destinationCount = trip.stop_count ?? 0;
  const dayCount = countTripDays(trip.start_date, trip.end_date);
  const isPortrait = layout === "portrait";

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-line transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] ${
        isPortrait ? "w-[250px] shrink-0" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${isPortrait ? "h-56" : "h-44"}`}>
        <img
          src={tripCoverPhoto(trip.name)}
          alt=""
          className="absolute inset-0 h-full w-full origin-center object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
        {trip.visibility ? (
          <span className="absolute top-3 right-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink uppercase">
            {trip.visibility.replace("_", " ")}
          </span>
        ) : null}
        <h3 className="absolute right-4 bottom-3 left-4 font-display text-xl font-semibold text-white drop-shadow">
          {trip.name}
        </h3>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-2 text-sm text-muted">
          <CalendarIcon />
          <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <PinIcon />
          <span>
            {dayCount} {dayCount === 1 ? "day" : "days"} · {destinationCount}{" "}
            {destinationCount === 1 ? "destination" : "destinations"}
          </span>
        </p>
        {trip.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{trip.description}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Link
            to={`/trips/${trip.id}`}
            className="text-sm font-semibold text-brand transition duration-150 hover:text-brand-dark"
          >
            View trip →
          </Link>
          <div className="flex gap-3">
            <Link to={`/trips/${trip.id}/edit`} className="text-sm text-muted hover:text-ink">
              Edit
            </Link>
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(trip)}
                disabled={isDeleting}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
