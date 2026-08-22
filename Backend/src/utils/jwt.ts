import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  userId: number;
}

export function generateAccessToken(
  userId: number
): string {
  return jwt.sign(
    {
      userId
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    } as jwt.SignOptions
  );
}

export function verifyAccessToken(
  token: string
): AuthTokenPayload {
  return jwt.verify(
    token,
    env.JWT_SECRET
  ) as AuthTokenPayload;
}