import type { ApiSuccess, AuthPayload, LoginRequest, RegisterRequest, User } from "@/types/user";
import api from "@/services/api";
import { isRecord, readNumber, readOptionalString, readString } from "@/utils/apiData";

function mapUser(value: unknown): User {
  if (!isRecord(value)) {
    throw new Error("Invalid user payload");
  }

  const id = readNumber(value, ["id"]);
  const email = readString(value, ["email"]);

  if (id === null || !email) {
    throw new Error("Invalid user payload");
  }

  return {
    id,
    username: readString(value, ["username"]),
    email,
    firstName: readString(value, ["firstName", "first_name"]),
    lastName: readString(value, ["lastName", "last_name"]),
    phone: readOptionalString(value, ["phone"]),
    countryId: readNumber(value, ["countryId", "country_id"]),
    cityId: readNumber(value, ["cityId", "city_id"]),
    role: readString(value, ["role"], "user") === "admin" ? "admin" : "user",
    isActive:
      typeof value.isActive === "boolean"
        ? value.isActive
        : typeof value.is_active === "boolean"
          ? value.is_active
          : undefined,
  };
}

function readAuthPayload(body: ApiSuccess<unknown>, fallbackMessage: string): AuthPayload {
  if (!body.success || !isRecord(body.data)) {
    throw new Error(body.message ?? fallbackMessage);
  }

  const token = readString(body.data, ["token", "access_token"]);
  if (!token) {
    throw new Error(body.message ?? fallbackMessage);
  }

  return {
    token,
    user: mapUser(body.data.user),
  };
}

export async function login(payload: LoginRequest): Promise<AuthPayload> {
  const { data } = await api.post<ApiSuccess<unknown>>("/auth/login", payload);
  return readAuthPayload(data, "Login failed");
}

export async function register(payload: RegisterRequest): Promise<AuthPayload> {
  const { data } = await api.post<ApiSuccess<unknown>>("/auth/register", payload);
  return readAuthPayload(data, "Registration failed");
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiSuccess<unknown>>("/auth/me");
  const payload = isRecord(data) && "data" in data ? data.data : data;

  if (isRecord(payload) && "user" in payload) {
    return mapUser(payload.user);
  }

  return mapUser(payload);
}

export async function logout(): Promise<void> {
  await api.post<ApiSuccess<Record<string, never>>>("/auth/logout");
}
