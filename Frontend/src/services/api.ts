import axios from "axios";
import { clearAccessToken, getAccessToken } from "@/utils/token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? "";
      const isCredentialRequest =
        requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

      if (!isCredentialRequest) {
        clearAccessToken();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
