import {
  createTripRequestSchema,
  tripListResponseSchema,
  tripResponseSchema,
  type CreateTripRequest,
  type Trip,
  type UpdateTripRequest,
} from "@/contracts/api";
import api from "@/services/api";

export async function getTrips(): Promise<Trip[]> {
  const { data } = await api.get("/trips");
  const parsed = tripListResponseSchema.parse(data);
  return parsed.data.trips;
}

export async function getTripById(tripId: number): Promise<Trip> {
  const { data } = await api.get(`/trips/${tripId}`);
  return tripResponseSchema.parse(data).data.trip;
}

export async function createTrip(payload: CreateTripRequest): Promise<Trip> {
  const body = createTripRequestSchema.parse(payload);
  const { data } = await api.post("/trips", body);
  return tripResponseSchema.parse(data).data.trip;
}

export async function updateTrip(tripId: number, payload: UpdateTripRequest): Promise<Trip> {
  const { data } = await api.put(`/trips/${tripId}`, payload);
  return tripResponseSchema.parse(data).data.trip;
}

export async function deleteTrip(tripId: number): Promise<void> {
  await api.delete(`/trips/${tripId}`);
}
