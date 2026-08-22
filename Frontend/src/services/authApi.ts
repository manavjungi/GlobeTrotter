import {
  authSessionSchema,
  currentUserResponseSchema,
  type LoginRequest,
  type RegisterRequest,
  type User,
} from "@/contracts/api";
import type { AuthPayload } from "@/types/user";
import api from "@/services/api";

export async function login(payload: LoginRequest): Promise<AuthPayload> {
  const { data } = await api.post("/auth/login", payload);
  const parsed = authSessionSchema.parse(data);
  return {
    token: parsed.data.token,
    user: parsed.data.user,
  };
}

export async function register(payload: RegisterRequest): Promise<AuthPayload> {
  const { data } = await api.post("/auth/register", payload);
  const parsed = authSessionSchema.parse(data);
  return {
    token: parsed.data.token,
    user: parsed.data.user,
  };
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get("/auth/me");
  const parsed = currentUserResponseSchema.parse(data);
  return parsed.data.user;
}

/**
 * JWT access tokens are stateless. This backend has no revoke/logout route,
 * so logout is clearing the client token (standard for Bearer JWT).
 */
export async function logout(): Promise<void> {
  return Promise.resolve();
}
