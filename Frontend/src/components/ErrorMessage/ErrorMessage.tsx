interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm text-red-700"
    >
      {message}
    </div>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left text-sm text-emerald-800"
    >
      {message}
    </div>
  );
}
