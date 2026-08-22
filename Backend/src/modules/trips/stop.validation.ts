import { z } from "zod";

export const createStopSchema = z.object({
  cityId: z
    .number()
    .int()
    .positive(),

  sequenceNo: z
    .number()
    .int()
    .positive()
    .optional(),

  arrivalDate: z
    .string()
    .date(),

  departureDate: z
    .string()
    .date(),

  arrivalTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
      "Invalid arrival time"
    )
    .optional(),

  departureTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
      "Invalid departure time"
    )
    .optional(),

  transportMode: z
    .string()
    .max(100)
    .optional(),

  transportCost: z
    .number()
    .nonnegative()
    .default(0),

  accommodationCost: z
    .number()
    .nonnegative()
    .default(0),

  notes: z
    .string()
    .max(5000)
    .optional()
});

export const updateStopSchema =
  createStopSchema.partial();