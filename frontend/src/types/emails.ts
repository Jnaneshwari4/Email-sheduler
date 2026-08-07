export type EmailStatus = "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";

export type EmailRecord = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  createdAt: string;
};

export type Sender = {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassEnc: string;
  createdAt: string;
};

export type ScheduleEmailPayload = {
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
};
