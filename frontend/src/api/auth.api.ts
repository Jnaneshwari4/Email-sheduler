import { http } from "./http";
import type { LoginResponse, ProfileResponse } from "../types/auth";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export async function loginWithGoogleToken(idToken: string): Promise<LoginResponse> {
  const response = await http.post<ApiEnvelope<LoginResponse>>("/auth/google", { idToken });
  return response.data.data;
}

export async function fetchProfile(): Promise<ProfileResponse> {
  const response = await http.get<ApiEnvelope<ProfileResponse>>("/profile");
  return response.data.data;
}

export async function logoutRequest(): Promise<void> {
  await http.post("/auth/logout");
}
