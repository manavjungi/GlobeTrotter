import axios from "axios";
import {
  catalogActivityListResponseSchema,
  catalogCityListResponseSchema,
  type CatalogActivity,
  type CatalogCity,
} from "@/contracts/api";
import { clearAccessToken, getAccessToken } from "@/utils/token";

function catalogBaseUrl(): string {
  const versioned = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";
  return versioned.replace(/\/v1\/?$/, "");
}

const catalogApi = axios.create({
  baseURL: catalogBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

catalogApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

catalogApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAccessToken();
    }
    return Promise.reject(error);
  },
);

export async function searchCities(search = ""): Promise<CatalogCity[]> {
  const { data } = await catalogApi.get("/cities", {
    params: search.trim() ? { search: search.trim() } : undefined,
  });
  return catalogCityListResponseSchema.parse(data).data.cities;
}

export async function searchActivities(options?: {
  search?: string;
  cityId?: number;
}): Promise<CatalogActivity[]> {
  const { data } = await catalogApi.get("/activities", {
    params: {
      ...(options?.search?.trim() ? { search: options.search.trim() } : {}),
      ...(options?.cityId ? { cityId: options.cityId } : {}),
    },
  });
  return catalogActivityListResponseSchema.parse(data).data.activities;
}
