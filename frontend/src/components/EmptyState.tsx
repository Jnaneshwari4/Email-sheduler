import type { JSX } from "react";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps): JSX.Element {
  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}
