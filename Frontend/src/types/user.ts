export type UserRole = "USER" | "ADMIN";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  profile_image?: string | null;
  additional_information?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  country?: string;
  additional_information?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
