export function toDateKey(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : value;
}

export function listTripDays(startDate: string, endDate: string): string[] {
  const start = toDateKey(startDate);
  const end = toDateKey(endDate);
  const startMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start);
  const endMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(end);
  if (!startMatch || !endMatch) {
    return start ? [start] : [];
  }

  const cursor = new Date(Date.UTC(Number(startMatch[1]), Number(startMatch[2]) - 1, Number(startMatch[3])));
  const last = new Date(Date.UTC(Number(endMatch[1]), Number(endMatch[2]) - 1, Number(endMatch[3])));
  const days: string[] = [];

  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

export function formatLongDate(value: string): string {
  const date = new Date(`${toDateKey(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toTimeInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const match = /^(\d{2}:\d{2})/.exec(value);
  return match ? match[1] : "";
}

export function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string | null {
  const start = toTimeInput(startTime);
  const end = toTimeInput(endTime);
  if (!start && !end) {
    return null;
  }
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start || end;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} – ${endDate}`;
  }

  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
