import { http } from "./http";
import type { Sender } from "../types/emails";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export async function fetchSenders(): Promise<Sender[]> {
  const response = await http.get<ApiEnvelope<Sender[]>>("/senders");
  return response.data.data;
}
