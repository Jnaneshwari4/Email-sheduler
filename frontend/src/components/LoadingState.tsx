import type { JSX } from "react";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading data..." }: LoadingStateProps): JSX.Element {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-amber-100 bg-white/85 text-slate-600">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-orange-500" />
        <span>{label}</span>
      </div>
    </div>
  );
}
