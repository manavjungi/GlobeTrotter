import { z } from "zod";

export const createTripSchema =
  z.object({
    name: z
      .string()
      .min(1)
      .max(200),

    description: z
      .string()
      .max(5000)
      .optional(),

    startDate: z
      .string()
      .date(),

    endDate: z
      .string()
      .date(),

    budget: z
      .number()
      .nonnegative()
      .optional(),

    currencyId: z
      .number()
      .int()
      .positive()
      .optional(),

    visibility: z
      .enum([
        "private",
        "link_only",
        "public"
      ])
      .default("private")
  });

export const updateTripSchema =
  createTripSchema.partial();