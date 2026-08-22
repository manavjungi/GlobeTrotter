import { useAuth } from "@/hooks/useAuth";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7fbfe] px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-[0_10px_40px_rgba(0,158,226,0.12)]">
        <p className="font-script text-4xl text-brand">GlobeTrotter</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-800">
          Welcome{user ? `, ${user.first_name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          You are signed in. The rest of the travel workspace will connect here next.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-6 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
