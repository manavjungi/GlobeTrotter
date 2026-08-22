interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function Loader({ label = "Loading...", fullScreen = false }: LoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen flex-col items-center justify-center gap-3 bg-white"
          : "flex flex-col items-center justify-center gap-3 py-8"
      }
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-wash border-t-brand" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
