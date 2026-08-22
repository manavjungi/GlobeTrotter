import { Link } from "react-router-dom";

interface ComingSoonPageProps {
  title: string;
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      <p className="mt-3 text-sm text-gray-500">
        This screen is not part of Dashboard. It will be built in a later phase.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
