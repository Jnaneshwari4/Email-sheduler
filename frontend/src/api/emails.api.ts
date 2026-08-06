import { http } from "./http";
import type { EmailRecord, ScheduleEmailPayload } from "../types/emails";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export async function scheduleEmails(payload: ScheduleEmailPayload): Promise<void> {
  await http.post("/emails/schedule", payload);
}

export async function fetchScheduledEmails(): Promise<EmailRecord[]> {
  const response = await http.get<ApiEnvelope<EmailRecord[]>>("/emails/scheduled");
  return response.data.data;
}

export async function fetchSentEmails(): Promise<EmailRecord[]> {
  const response = await http.get<ApiEnvelope<EmailRecord[]>>("/emails/sent");
  return response.data.data;
}
