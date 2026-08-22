export type UserRole = "user" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  countryId?: number | null;
  cityId?: number | null;
  role: UserRole;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryId: number;
  cityId: number;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
}
