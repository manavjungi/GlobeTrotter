import type { User } from "@/contracts/api";

export type { LoginRequest, RegisterRequest, User } from "@/contracts/api";

export interface AuthPayload {
  user: User;
  token: string;
}
