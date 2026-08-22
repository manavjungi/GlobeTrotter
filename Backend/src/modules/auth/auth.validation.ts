import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores"
    ),

  email: z
    .email(),

  password: z
    .string()
    .min(8)
    .max(100),

  firstName: z
    .string()
    .min(1)
    .max(100),

  lastName: z
    .string()
    .max(100)
    .optional(),

  phone: z
    .string()
    .max(30)
    .optional(),

  countryId: z
    .number()
    .int()
    .positive()
    .optional(),

  cityId: z
    .number()
    .int()
    .positive()
    .optional()
});

export const loginSchema = z.object({
  email: z.email(),

  password: z
    .string()
    .min(1)
});