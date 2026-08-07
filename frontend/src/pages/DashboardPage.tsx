import { StatsCards } from "../components/StatsCards";import { useEffect, useMemo, useState, type JSX } from "react";
import toast from "react-hot-toast";
import { fetchScheduledEmails, fetchSentEmails, deleteScheduledEmail, deleteScheduledEmails } from "../api/emails.api";
import { ComposeEmailModal } from "../components/ComposeEmailModal";
import { DashboardHeader } from "../components/DashboardHeader";
import { EmailTable } from "../components/EmailTable";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import type { EmailRecord } from "../types/emails";


type TabKey = "scheduled" | "sent";

export function DashboardPage(): JSX.Element {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("scheduled");
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledEmails, setScheduledEmails] = useState<EmailRecord[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailRecord[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadData = async (target: TabKey | "both" = "both", silent = false): Promise<void> => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      if (target === "both" || target === "scheduled") {
        const scheduled = await fetchScheduledEmails();
        setScheduledEmails(scheduled);
      }

      if (target === "both" || target === "sent") {
        const sent = await fetchSentEmails();
        setSentEmails(sent);
      }
    } catch {
      if (!silent) {
        toast.error("Failed to load email data. Check backend API status.");
      }

      if (target === "both" || target === "scheduled") {
        setScheduledEmails([]);
      }
      if (target === "both" || target === "sent") {
        setSentEmails([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (activeTab !== "scheduled") {
      setSelectedIds([]);
    }

    void loadData(activeTab, true);
  }, [activeTab]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadData(activeTab, true);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeTab]);

  const activeRows = useMemo(
    () => (activeTab === "scheduled" ? scheduledEmails : sentEmails),
    [activeTab, scheduledEmails, sentEmails]
  );

  const handleToggleRow = (emailJobId: string, selected: boolean): void => {
    setSelectedIds((current) =>
      selected ? [...current, emailJobId] : current.filter((id) => id !== emailJobId)
    );
  };

  const handleToggleSelectAll = (selected: boolean): void => {
    if (selected) {
      setSelectedIds(scheduledEmails.map((email) => email.id));
      return;
    }

    setSelectedIds([]);
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one scheduled email to cancel.");
      return;
    }

    const confirmed = window.confirm(
      `Cancel schedule for ${selectedIds.length} scheduled email${selectedIds.length > 1 ? "s" : ""}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteScheduledEmails(selectedIds);
      toast.success("Selected scheduled schedules canceled");
      setSelectedIds([]);
      await loadData();
    } catch {
      toast.error("Failed to cancel selected scheduled emails");
    }
  };

  const handleDelete = async (emailJobId: string): Promise<void> => {
    setDeletingId(emailJobId);

    try {
      await deleteScheduledEmail(emailJobId);
      toast.success("Scheduled email canceled");
      await loadData();
    } catch {
      toast.error("Failed to cancel scheduled email");
    } finally {
      setDeletingId(null);
    }
  };
const totalScheduled = scheduledEmails.length;

const totalSent = sentEmails.length;

const totalFailed = sentEmails.filter(
  (email) => email.status === "FAILED"
).length;

const successRate =
  totalSent > 0
    ? Math.round(
        ((totalSent - totalFailed) / totalSent) * 100
      )
    : 100;

  if (!user) {
    return <LoadingState label="Loading profile..." />;
  }

  return (
  <main className="min-h-screen bg-gradient-to-r from-orange-50 via-white to-orange-100 py-10">
    <div className="mx-auto max-w-6xl px-4">

      <DashboardHeader
        user={user}
        onLogout={logout}
      />

      <div className="my-6">
        <StatsCards
          scheduled={totalScheduled}
          sent={totalSent}
          failed={totalFailed}
          successRate={successRate}
        />
      </div>



        <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-xl shadow-orange-100/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-orange-100 bg-orange-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("scheduled");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "scheduled" ? "bg-white text-orange-700 shadow" : "text-slate-600"
                }`}
              >
                Scheduled Emails
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("sent");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "sent" ? "bg-white text-orange-700 shadow" : "text-slate-600"
                }`}
              >
                Sent Emails
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setComposeOpen(true);
              }}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:brightness-110"
            >
              Compose Email
            </button>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <LoadingState />
            ) : activeRows.length === 0 ? (
              <EmptyState
                title={activeTab === "scheduled" ? "No scheduled emails" : "No sent emails"}
                message={
                  activeTab === "scheduled"
                    ? "Start by creating a campaign from Compose Email."
                    : "Sent items will appear once the worker starts delivering messages."
                }
              />
            ) : (
              <>
                {activeTab === "scheduled" ? (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      {selectedIds.length > 0
                        ? `${selectedIds.length} selected`
                        : "Select scheduled emails to cancel in bulk."}
                    </p>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={selectedIds.length === 0}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 text-sm font-semibold rounded-xl shadow-lg shadow-red-200 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel Selected
                    </button>
                  </div>
                ) : null}

                <EmailTable
                  rows={activeRows}
                  showSentAt={activeTab === "sent"}
                  selectable={activeTab === "scheduled"}
                  selectedIds={activeTab === "scheduled" ? selectedIds : []}
                  onToggleRow={handleToggleRow}
                  onToggleSelectAll={handleToggleSelectAll}
                  onDelete={activeTab === "scheduled" ? handleDelete : undefined}
                  deletingId={deletingId}
                />
              </>
            )}
          </div>
        </section>
      </div>

      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => {
          setComposeOpen(false);
        }}
        onScheduled={loadData}
      />
    </main>
  );
}
