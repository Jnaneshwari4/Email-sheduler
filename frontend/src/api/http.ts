import axios from "axios";
import { getAccessToken } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
