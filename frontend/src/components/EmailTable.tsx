import type { EmailRecord } from "../types/emails";
import type { JSX } from "react";

type EmailTableProps = {
  rows: EmailRecord[];
  showSentAt?: boolean;
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function statusBadge(status: EmailRecord["status"]): string {
  switch (status) {
    case "SENT":
      return "bg-emerald-100 text-emerald-700";
    case "FAILED":
      return "bg-rose-100 text-rose-700";
    case "PROCESSING":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export function EmailTable({ rows, showSentAt = false }: EmailTableProps): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-2xl border border-amber-100 bg-white/90">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-amber-50 text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Recipient</th>
            <th className="px-4 py-3 font-semibold">Subject</th>
            <th className="px-4 py-3 font-semibold">Scheduled</th>
            {showSentAt ? <th className="px-4 py-3 font-semibold">Sent</th> : null}
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-amber-100/80">
              <td className="px-4 py-3 text-slate-800">{row.recipient}</td>
              <td className="px-4 py-3 text-slate-700">{row.subject}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(row.scheduledAt)}</td>
              {showSentAt ? <td className="px-4 py-3 text-slate-600">{formatDateTime(row.sentAt)}</td> : null}
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
