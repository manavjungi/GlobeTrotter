import type { City } from "@/types/city";
import type { ApiSuccess } from "@/types/user";
import api from "@/services/api";
import {
  isRecord,
  readNumber,
  readOptionalString,
  readString,
  unwrapList,
} from "@/utils/apiData";

function mapCity(value: unknown): City | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readNumber(value, ["id"]);
  const name = readString(value, ["name"]);
  const country = readString(value, ["country"]);

  if (id === null || !name) {
    return null;
  }

  return {
    id,
    name,
    country,
    region: readOptionalString(value, ["region"]),
    description: readOptionalString(value, ["description"]),
    cost_index: readNumber(value, ["cost_index", "costIndex"]),
    popularity_score: readNumber(value, ["popularity_score", "popularityScore"]),
    image_url: readOptionalString(value, ["image_url", "imageUrl"]),
  };
}

export async function getCities(): Promise<City[]> {
  const { data } = await api.get<ApiSuccess<unknown> | unknown>("/cities");
  const payload = isRecord(data) && "data" in data ? data.data : data;
  return unwrapList(payload, ["cities"]).map(mapCity).filter((city): city is City => city !== null);
}
