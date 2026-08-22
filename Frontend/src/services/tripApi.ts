import type { ApiSuccess } from "@/types/user";
import type { Trip } from "@/types/trip";
import api from "@/services/api";
import {
  isRecord,
  readNumber,
  readOptionalString,
  readString,
  unwrapList,
} from "@/utils/apiData";

function mapTrip(value: unknown): Trip | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readNumber(value, ["id"]);
  const name = readString(value, ["name", "title"]);
  const startDate = readString(value, ["start_date", "startDate"]);
  const endDate = readString(value, ["end_date", "endDate"]);

  if (id === null || !name || !startDate || !endDate) {
    return null;
  }

  return {
    id,
    name,
    description: readOptionalString(value, ["description"]),
    start_date: startDate,
    end_date: endDate,
    status: readOptionalString(value, ["status"]),
    budget_limit: readNumber(value, ["budget_limit", "budgetLimit"]),
    cover_image: readOptionalString(value, ["cover_image", "coverImage"]),
  };
}

export async function getTrips(): Promise<Trip[]> {
  const { data } = await api.get<ApiSuccess<unknown> | unknown>("/trips");
  const payload = isRecord(data) && "data" in data ? data.data : data;
  return unwrapList(payload, ["trips"]).map(mapTrip).filter((trip): trip is Trip => trip !== null);
}
