import { z } from "zod";

export const createActivitySchema = z.object({
  tripStopId: z
    .number()
    .int()
    .positive(),

  activityId: z
    .number()
    .int()
    .positive(),

  activityDate: z
    .string()
    .date(),

  startTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
      "Invalid start time"
    )
    .optional(),

  endTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
      "Invalid end time"
    )
    .optional(),

  sequenceNo: z
    .number()
    .int()
    .positive()
    .optional(),

  estimatedCost: z
    .number()
    .nonnegative()
    .default(0),

  actualCost: z
    .number()
    .nonnegative()
    .optional(),

  status: z
    .string()
    .max(50)
    .default("planned"),

  notes: z
    .string()
    .max(5000)
    .optional()
});

export const updateActivitySchema =
  createActivitySchema.partial();