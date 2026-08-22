import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/dashboard" className="font-script text-[1.85rem] leading-none text-brand">
          GlobeTrotter
        </Link>
        <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `border-b-2 px-2 py-1.5 transition duration-150 ${
                isActive ? "border-brand font-medium text-ink" : "border-transparent text-muted hover:text-ink"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `border-b-2 px-2 py-1.5 transition duration-150 ${
                isActive ? "border-brand font-medium text-ink" : "border-transparent text-muted hover:text-ink"
              }`
            }
          >
            My Trips
          </NavLink>
          <span className="hidden max-w-[8rem] truncate px-2 text-xs text-muted sm:inline">
            {user?.first_name || user?.username || user?.email}
          </span>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="ml-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition duration-150 hover:text-ink"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
