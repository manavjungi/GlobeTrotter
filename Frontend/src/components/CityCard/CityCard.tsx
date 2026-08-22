import type { City } from "@/types/city";

interface CityCardProps {
  city: City;
}

export function CityCard({ city }: CityCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-brand-soft/60 bg-white shadow-sm">
      {city.image_url ? (
        <img src={city.image_url} alt={city.name} className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-24 items-center justify-center bg-brand-wash text-sm text-brand">
          {city.name}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800">{city.name}</h3>
        {city.country ? <p className="mt-1 text-sm text-gray-500">{city.country}</p> : null}
        {city.region ? <p className="text-xs text-gray-400">{city.region}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
          {city.popularity_score !== null ? (
            <span className="rounded-full bg-brand-wash px-2 py-0.5">
              Popularity {city.popularity_score}
            </span>
          ) : null}
          {city.cost_index !== null ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5">Cost {city.cost_index}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
