import type { EmailRecord } from "../types/emails";
import type { JSX } from "react";

type EmailTableProps = {
  rows: EmailRecord[];
  showSentAt?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  deletingId?: string | null;
  onDelete?: (emailJobId: string) => void;
  onToggleRow?: (emailJobId: string, selected: boolean) => void;
  onToggleSelectAll?: (selected: boolean) => void;
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
    
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export function EmailTable({
  rows,
  showSentAt = false,
  selectable = false,
  selectedIds = [],
  deletingId,
  onDelete,
  onToggleRow,
  onToggleSelectAll
}: EmailTableProps): JSX.Element {
  const allSelected = selectable && rows.length > 0 && selectedIds.length === rows.length;

  return (
    <div className="overflow-x-auto rounded-2xl border border-amber-100 bg-white/90">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-amber-50 text-slate-700">
          <tr>
            {selectable ? (
              <th className="px-4 py-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => onToggleSelectAll?.(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500"
                />
              </th>
            ) : null}
            <th className="px-4 py-3 font-semibold">Recipient</th>
            <th className="px-4 py-3 font-semibold">Subject</th>
            <th className="px-4 py-3 font-semibold">Scheduled</th>
            {showSentAt ? <th className="px-4 py-3 font-semibold">Sent</th> : null}
            <th className="px-4 py-3 font-semibold">Status</th>
            {onDelete ? <th className="px-4 py-3 font-semibold">Action</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selectable && selectedIds.includes(row.id);

            return (
              <tr key={row.id} className="border-t border-amber-100/80">
                {selectable ? (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => onToggleRow?.(row.id, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-500"
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3 text-slate-800">{row.recipient}</td>
                <td className="px-4 py-3 text-slate-700">{row.subject}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(row.scheduledAt)}</td>
                {showSentAt ? <td className="px-4 py-3 text-slate-600">{formatDateTime(row.sentAt)}</td> : null}
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                {onDelete ? (
                  <td className="px-4 py-3">
                    <button
  type="button"
  onClick={() => onDelete(row.id)}
  disabled={deletingId === row.id}
  className="
    inline-flex
    items-center
    justify-center
    bg-red-500
    hover:bg-red-600
    text-white
    text-xs
    font-medium
    px-3
    py-1.5
    rounded-lg
    transition
    shadow-sm
    hover:shadow-md
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
>
  {deletingId === row.id ? "Canceling..." : "Cancel"}
</button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
