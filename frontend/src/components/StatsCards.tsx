import type { JSX } from "react";

type StatsCardsProps = {
  scheduled: number;
  sent: number;
  failed: number;
};

type CardProps = {
  title: string;
  value: number;
  bg: string;
  text: string;
};

function Card({ title, value, bg, text }: CardProps): JSX.Element {
  return (
    <div
      className={`rounded-2xl border border-slate-200 ${bg} p-5 shadow-sm transition hover:shadow-md`}
    >
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <h2 className={`mt-2 text-4xl font-bold ${text}`}>{value}</h2>
    </div>
  );
}

export function StatsCards({
  scheduled,
  sent,
  failed
}: StatsCardsProps): JSX.Element {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        title="Scheduled"
        value={scheduled}
        bg="bg-amber-50"
        text="text-amber-700"
      />

      <Card
        title="Sent"
        value={sent}
        bg="bg-emerald-50"
        text="text-emerald-700"
      />

      

      <Card
        title="Failed"
        value={failed}
        bg="bg-rose-50"
        text="text-rose-700"
      />
    </div>
  );
}