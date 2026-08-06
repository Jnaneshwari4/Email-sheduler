import { useEffect, useMemo, useState, type JSX } from "react";
import toast from "react-hot-toast";
import { fetchScheduledEmails, fetchSentEmails } from "../api/emails.api";
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

  const loadData = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const [scheduled, sent] = await Promise.all([fetchScheduledEmails(), fetchSentEmails()]);
      setScheduledEmails(scheduled);
      setSentEmails(sent);
    } catch {
      toast.error("Failed to load email data. Check backend API status.");
      setScheduledEmails([]);
      setSentEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeRows = useMemo(
    () => (activeTab === "scheduled" ? scheduledEmails : sentEmails),
    [activeTab, scheduledEmails, sentEmails]
  );

  if (!user) {
    return <LoadingState label="Loading profile..." />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_15%,#fed7aa_0,#fff7ed_30%,#fff_70%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <DashboardHeader user={user} onLogout={logout} />

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
              <EmailTable rows={activeRows} showSentAt={activeTab === "sent"} />
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
