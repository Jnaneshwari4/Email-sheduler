import type { AuthUser } from "../types/auth";
import type { JSX } from "react";


type DashboardHeaderProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps): JSX.Element {
  return (
    <header className="rounded-3xl border border-amber-100 bg-white/90 p-5 shadow-glow backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-12 w-12 rounded-full border border-orange-200 object-cover"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 font-semibold text-white">
              {initials(user.name)}
            </div>
          )}
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void onLogout();
          }}
          className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
