import { useMemo, useState, type ChangeEvent, type JSX } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { scheduleEmails } from "../api/emails.api";
import { parseEmailCsv } from "../utils/csv";

type ComposeEmailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => Promise<void>;
};

type ComposeFormValues = {
  senderId: string;
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
};

export function ComposeEmailModal({
  isOpen,
  onClose,
  onScheduled
}: ComposeEmailModalProps): JSX.Element | null {
  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [isCsvParsing, setIsCsvParsing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ComposeFormValues>({
    defaultValues: {
      senderId: "",
      subject: "",
      body: "",
      startTime: "",
      delaySeconds: 10,
      hourlyLimit: 100
    }
  });

  const hasEmails = validEmails.length > 0;

  const invalidPreview = useMemo(() => invalidEmails.slice(0, 5), [invalidEmails]);

  const handleCsvChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsCsvParsing(true);

    try {
      const result = await parseEmailCsv(file);
      setValidEmails(result.validEmails);
      setInvalidEmails(result.invalidEmails);
      toast.success(`CSV processed: ${result.validEmails.length} valid email(s)`);

      if (result.invalidEmails.length > 0) {
        toast.error(`${result.invalidEmails.length} invalid email(s) ignored`);
      }
    } catch {
      toast.error("Failed to parse CSV file");
      setValidEmails([]);
      setInvalidEmails([]);
    } finally {
      setIsCsvParsing(false);
    }
  };

  const submit = async (values: ComposeFormValues): Promise<void> => {
    if (!hasEmails) {
      toast.error("Upload a CSV with at least one valid email address");
      return;
    }

    await scheduleEmails({
      senderId: values.senderId,
      subject: values.subject,
      body: values.body,
      recipients: validEmails,
      startTime: values.startTime,
      delaySeconds: values.delaySeconds,
      hourlyLimit: values.hourlyLimit
    });

    toast.success("Email campaign scheduled");
    await onScheduled();
    reset();
    setValidEmails([]);
    setInvalidEmails([]);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Compose Email Campaign</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sender ID</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 focus:ring"
              {...register("senderId", { required: "Sender ID is required" })}
            />
            {errors.senderId ? <p className="mt-1 text-xs text-rose-600">{errors.senderId.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 focus:ring"
                {...register("startTime", { required: "Start time is required" })}
              />
              {errors.startTime ? <p className="mt-1 text-xs text-rose-600">{errors.startTime.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Delay Between Emails (seconds)</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 focus:ring"
                {...register("delaySeconds", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Delay must be at least 1 second" }
                })}
              />
              {errors.delaySeconds ? (
                <p className="mt-1 text-xs text-rose-600">{errors.delaySeconds.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Hourly Sending Limit</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 focus:ring"
              {...register("hourlyLimit", {
                valueAsNumber: true,
                min: { value: 1, message: "Hourly limit must be at least 1" }
              })}
            />
            {errors.hourlyLimit ? <p className="mt-1 text-xs text-rose-600">{errors.hourlyLimit.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 focus:ring"
              {...register("subject", { required: "Subject is required" })}
            />
            {errors.subject ? <p className="mt-1 text-xs text-rose-600">{errors.subject.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Body</label>
            <textarea
              rows={6}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 focus:ring"
              {...register("body", { required: "Body is required" })}
            />
            {errors.body ? <p className="mt-1 text-xs text-rose-600">{errors.body.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Upload CSV</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                void handleCsvChange(event);
              }}
              className="block w-full text-sm text-slate-600"
            />
            <p className="mt-2 text-xs text-slate-500">
              {isCsvParsing
                ? "Parsing CSV..."
                : `${validEmails.length} valid email(s) detected`}
            </p>
            {invalidEmails.length > 0 ? (
              <p className="mt-1 text-xs text-amber-700">
                Invalid: {invalidEmails.length} ({invalidPreview.join(", ")}
                {invalidEmails.length > invalidPreview.length ? "..." : ""})
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Emails"}
          </button>
        </form>
      </div>
    </div>
  );
}
