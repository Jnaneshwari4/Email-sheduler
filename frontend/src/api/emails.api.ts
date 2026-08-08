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

export async function deleteScheduledEmail(emailJobId: string): Promise<void> {
  await http.delete(`/emails/scheduled/${emailJobId}`);
}

export async function deleteScheduledEmails(emailJobIds: string[]): Promise<void> {
  await http.post("/emails/scheduled/delete", { ids: emailJobIds });
}

export async function deleteSentEmails(): Promise<void> {
  await http.post("/emails/sent/delete", {});
}
