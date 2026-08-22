import { z } from "zod";

export const createExpenseSchema = z.object({
  tripStopId: z
    .number()
    .int()
    .positive()
    .optional(),

  tripActivityId: z
    .number()
    .int()
    .positive()
    .optional(),

  category: z
    .string()
    .min(1)
    .max(100),

  description: z
    .string()
    .min(1)
    .max(500),

  amount: z
    .number()
    .positive(),

  currency: z
    .string()
    .length(3)
    .default("INR"),

  expenseDate: z
    .string()
    .date(),

  isEstimated: z
    .boolean()
    .default(false),

  isActual: z
    .boolean()
    .default(true)
});

export const updateExpenseSchema =
  createExpenseSchema.partial();