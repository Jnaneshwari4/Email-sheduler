import type { JSX } from "react";
import { Link } from "react-router-dom";

export function NotFoundPage(): JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
