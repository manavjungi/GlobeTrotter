import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-brand-soft/40 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/dashboard" className="font-script text-3xl text-brand">
          GlobeTrotter
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "font-medium text-brand" : "text-gray-500 hover:text-brand"
            }
          >
            Dashboard
          </NavLink>
          <span className="hidden text-gray-400 sm:inline">
            {user?.firstName || user?.username || user?.email}
          </span>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="rounded-md border border-brand-soft px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand-wash"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
