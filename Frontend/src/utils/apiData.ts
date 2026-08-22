export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(
  record: Record<string, unknown>,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return fallback;
}

export function readNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

export function readOptionalString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  const value = readString(record, keys);
  return value.length > 0 ? value : null;
}

export function unwrapList(payload: unknown, nestedKeys: string[] = []): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if ("data" in payload) {
    const nested = unwrapList(payload.data, nestedKeys);
    if (nested.length > 0 || Array.isArray(payload.data)) {
      return Array.isArray(payload.data) ? payload.data : nested;
    }
  }

  for (const key of nestedKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}
