interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function Loader({ label = "Loading...", fullScreen = false }: LoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f4f7fb]"
          : "flex flex-col items-center justify-center gap-3 py-8"
      }
    >
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-soft border-t-brand" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function TripDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-56 animate-pulse rounded-3xl bg-slate-200" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
        <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
        <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
      </div>
      <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
      <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
    </div>
  );
}
