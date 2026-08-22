import {
  createActivityRequestSchema,
  createStopRequestSchema,
  tripActivityListResponseSchema,
  tripActivityResponseSchema,
  tripStopListResponseSchema,
  type CreateActivityRequest,
  type CreateStopRequest,
  type TripActivity,
  type TripStop,
  type UpdateActivityRequest,
} from "@/contracts/api";
import api from "@/services/api";

export async function getTripStops(tripId: number): Promise<TripStop[]> {
  const { data } = await api.get(`/trips/${tripId}/stops`);
  return tripStopListResponseSchema.parse(data).data.stops;
}

export async function createTripStop(
  tripId: number,
  payload: CreateStopRequest,
): Promise<void> {
  const body = createStopRequestSchema.parse(payload);
  await api.post(`/trips/${tripId}/stops`, body);
}

export async function getTripActivities(tripId: number): Promise<TripActivity[]> {
  const { data } = await api.get(`/trips/${tripId}/activities`);
  return tripActivityListResponseSchema.parse(data).data.activities;
}

export async function createTripActivity(
  tripId: number,
  payload: CreateActivityRequest,
): Promise<TripActivity> {
  const body = createActivityRequestSchema.parse(payload);
  const { data } = await api.post(`/trips/${tripId}/activities`, body);
  return tripActivityResponseSchema.parse(data).data.activity;
}

export async function updateTripActivity(
  tripId: number,
  activityId: number,
  payload: UpdateActivityRequest,
): Promise<TripActivity> {
  const { data } = await api.put(`/trips/${tripId}/activities/${activityId}`, payload);
  return tripActivityResponseSchema.parse(data).data.activity;
}

export async function deleteTripActivity(tripId: number, activityId: number): Promise<void> {
  await api.delete(`/trips/${tripId}/activities/${activityId}`);
}
