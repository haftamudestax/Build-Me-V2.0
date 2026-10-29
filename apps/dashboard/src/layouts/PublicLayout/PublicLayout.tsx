import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/login"
            className="text-xl font-bold tracking-tight text-sky-700"
            aria-label="Build Me Admin home"
          >
            Build Me
          </Link>

          <span className="text-sm text-slate-500">Administration</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-500">
        Build Me Administration
      </footer>
    </div>
  );
}
