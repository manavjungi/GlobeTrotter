import { z } from "zod";
import { TransportMode, TripActivityStatus, TripStatus, TripVisibility, UserRole } from "@/types/enums";

/** Postgres DATE / timestamptz → YYYY-MM-DD for date inputs and display. */
const sqlDateSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
    return match ? match[1] : value;
  }
  return value;
}, z.string());

export const userSchema = z
  .object({
    id: z.coerce.number(),
    username: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    country_id: z.coerce.number().nullable().optional(),
    city_id: z.coerce.number().nullable().optional(),
    role: z.enum(UserRole).optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerRequestSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
});

export const authSessionSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    user: userSchema,
    token: z.string(),
  }),
});

export const currentUserResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    user: userSchema,
  }),
});

export const tripSchema = z
  .object({
    id: z.coerce.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    start_date: sqlDateSchema,
    end_date: sqlDateSchema,
    budget: z.coerce.number().nullable().optional(),
    status: z.enum(TripStatus).nullable().optional(),
    visibility: z.enum(TripVisibility).nullable().optional(),
    stop_count: z.coerce.number().optional().default(0),
    activity_count: z.coerce.number().optional().default(0),
  })
  .passthrough();

export const createTripRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budget: z.number().nonnegative().optional(),
  visibility: z.enum(TripVisibility).optional(),
});

export const tripResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    trip: tripSchema,
  }),
});

export const tripListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    trips: z.array(tripSchema),
  }),
});

export const tripStopSchema = z
  .object({
    id: z.coerce.number(),
    trip_id: z.coerce.number().optional(),
    city_id: z.coerce.number(),
    sequence_no: z.coerce.number().optional(),
    arrival_date: sqlDateSchema,
    departure_date: sqlDateSchema,
    city_name: z.string().nullable().optional(),
    country_name: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    transport_mode: z.enum(TransportMode).nullable().optional(),
  })
  .passthrough();

export const tripActivitySchema = z
  .object({
    id: z.coerce.number(),
    trip_id: z.coerce.number().optional(),
    trip_stop_id: z.coerce.number(),
    activity_id: z.coerce.number(),
    activity_date: sqlDateSchema,
    start_time: z.string().nullable().optional(),
    end_time: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(TripActivityStatus).nullable().optional(),
    activity_name: z.string().nullable().optional(),
    city_name: z.string().nullable().optional(),
    estimated_cost: z.coerce.number().nullable().optional(),
  })
  .passthrough();

export const tripStopListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    stops: z.array(tripStopSchema),
  }),
});

export const tripActivityListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    activities: z.array(tripActivitySchema),
  }),
});

export const tripActivityResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    activity: tripActivitySchema,
  }),
});

export const createStopRequestSchema = z.object({
  cityId: z.number().int().positive(),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createActivityRequestSchema = z.object({
  tripStopId: z.number().int().positive(),
  activityId: z.number().int().positive(),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().max(5000).optional(),
  estimatedCost: z.number().nonnegative().optional(),
  status: z.enum(TripActivityStatus).optional(),
});

export type User = z.infer<typeof userSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type Trip = z.infer<typeof tripSchema>;
export type CreateTripRequest = z.infer<typeof createTripRequestSchema>;
export type UpdateTripRequest = Partial<CreateTripRequest>;
export type TripStop = z.infer<typeof tripStopSchema>;
export type TripActivity = z.infer<typeof tripActivitySchema>;
export type CreateStopRequest = z.infer<typeof createStopRequestSchema>;
export type CreateActivityRequest = z.infer<typeof createActivityRequestSchema>;
export type UpdateActivityRequest = Partial<CreateActivityRequest>;
