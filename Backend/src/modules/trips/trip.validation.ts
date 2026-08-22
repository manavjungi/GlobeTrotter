import { z } from "zod";

export const createTripSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Trip name is required")
    .max(200, "Trip name cannot exceed 200 characters"),

  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  startDate: z
    .string()
    .date("Invalid start date"),

  endDate: z
    .string()
    .date("Invalid end date"),

  budget: z
    .number()
    .nonnegative("Budget cannot be negative")
    .optional(),

  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .transform((value) => value.toUpperCase())
    .optional(),

  visibility: z
    .enum([
      "private",
      "link_only",
      "public"
    ])
    .default("private"),

  coverImageUrl: z
    .string()
    .url("Invalid cover image URL")
    .optional()
});

export const updateTripSchema =
  createTripSchema.partial();