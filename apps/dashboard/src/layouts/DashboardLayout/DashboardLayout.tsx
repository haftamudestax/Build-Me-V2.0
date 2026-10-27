import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth/useAuth";

export default function DashboardLayout() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("[Auth] Sign-out failed:", error);
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-sky-100 text-sky-800"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <NavLink
            to="/dashboard"
            className="text-xl font-bold tracking-tight text-sky-700"
          >
            Build Me Admin
          </NavLink>

          <nav
            aria-label="Dashboard navigation"
            className="flex flex-wrap gap-2"
          >
            <NavLink to="/dashboard" end className={navLinkClass}>
              Overview
            </NavLink>

            {role && ["admin", "super_admin"].includes(role) && (
              <NavLink to="/dashboard/users" className={navLinkClass}>
                Users
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user?.email ?? "Authenticated user"}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {role?.replace("_", " ") ?? "Role unavailable"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
