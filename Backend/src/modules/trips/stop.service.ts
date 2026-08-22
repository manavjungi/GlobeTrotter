import { pool } from "../../config/database";

interface CreateStopInput {
  cityId: number;
  sequenceNo?: number;
  arrivalDate: string;
  departureDate: string;
  arrivalTime?: string;
  departureTime?: string;
  transportMode?: string;
  transportCost?: number;
  accommodationCost?: number;
  notes?: string;
}

interface UpdateStopInput {
  cityId?: number;
  sequenceNo?: number;
  arrivalDate?: string;
  departureDate?: string;
  arrivalTime?: string;
  departureTime?: string;
  transportMode?: string;
  transportCost?: number;
  accommodationCost?: number;
  notes?: string;
}

async function verifyTripOwnership(
  userId: number,
  tripId: number
): Promise<boolean> {
  const result = await pool.query(
    `
      SELECT id
      FROM trips
      WHERE id = $1
        AND owner_id = $2
      LIMIT 1
    `,
    [tripId, userId]
  );

  return result.rows.length > 0;
}

export async function createStop(
  userId: number,
  tripId: number,
  input: CreateStopInput
) {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error("Trip not found");
  }

  if (
    new Date(input.departureDate) <
    new Date(input.arrivalDate)
  ) {
    throw new Error(
      "Departure date cannot be before arrival date"
    );
  }

  const result = await pool.query(
    `
      INSERT INTO trip_stops (
        trip_id,
        city_id,
        sequence_no,
        arrival_date,
        departure_date,
        arrival_time,
        departure_time,
        transport_mode,
        transport_cost,
        accommodation_cost,
        notes
      )
      VALUES (
        $1,
        $2,
        COALESCE(
          $3,
          (
            SELECT COALESCE(
              MAX(sequence_no) + 1,
              1
            )
            FROM trip_stops
            WHERE trip_id = $1
          )
        ),
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      )
      RETURNING *
    `,
    [
      tripId,
      input.cityId,
      input.sequenceNo ?? null,
      input.arrivalDate,
      input.departureDate,
      input.arrivalTime ?? null,
      input.departureTime ?? null,
      input.transportMode ?? null,
      input.transportCost ?? 0,
      input.accommodationCost ?? 0,
      input.notes ?? null
    ]
  );

  return result.rows[0];
}

export async function getTripStops(
  userId: number,
  tripId: number
) {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error("Trip not found");
  }

  const result = await pool.query(
    `
      SELECT
        ts.*,
        c.name AS city_name,
        co.name AS country_name

      FROM trip_stops ts

      LEFT JOIN cities c
        ON c.id = ts.city_id

      LEFT JOIN countries co
        ON co.id = c.country_id

      WHERE ts.trip_id = $1

      ORDER BY
        ts.sequence_no ASC
    `,
    [tripId]
  );

  return result.rows;
}

export async function updateStop(
  userId: number,
  tripId: number,
  stopId: number,
  input: UpdateStopInput
) {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error("Trip not found");
  }

  const existing =
    await pool.query(
      `
        SELECT *
        FROM trip_stops
        WHERE id = $1
          AND trip_id = $2
        LIMIT 1
      `,
      [stopId, tripId]
    );

  if (existing.rows.length === 0) {
    throw new Error("Stop not found");
  }

  const current =
    existing.rows[0];

  const cityId =
    input.cityId ??
    current.city_id;

  const sequenceNo =
    input.sequenceNo ??
    current.sequence_no;

  const arrivalDate =
    input.arrivalDate ??
    current.arrival_date;

  const departureDate =
    input.departureDate ??
    current.departure_date;

  const arrivalTime =
    input.arrivalTime ??
    current.arrival_time;

  const departureTime =
    input.departureTime ??
    current.departure_time;

  const transportMode =
    input.transportMode ??
    current.transport_mode;

  const transportCost =
    input.transportCost ??
    current.transport_cost;

  const accommodationCost =
    input.accommodationCost ??
    current.accommodation_cost;

  const notes =
    input.notes ??
    current.notes;

  if (
    new Date(departureDate) <
    new Date(arrivalDate)
  ) {
    throw new Error(
      "Departure date cannot be before arrival date"
    );
  }

  const result = await pool.query(
    `
      UPDATE trip_stops
      SET
        city_id = $1,
        sequence_no = $2,
        arrival_date = $3,
        departure_date = $4,
        arrival_time = $5,
        departure_time = $6,
        transport_mode = $7,
        transport_cost = $8,
        accommodation_cost = $9,
        notes = $10,
        updated_at = NOW()

      WHERE id = $11
        AND trip_id = $12

      RETURNING *
    `,
    [
      cityId,
      sequenceNo,
      arrivalDate,
      departureDate,
      arrivalTime,
      departureTime,
      transportMode,
      transportCost,
      accommodationCost,
      notes,
      stopId,
      tripId
    ]
  );

  return result.rows[0];
}

export async function deleteStop(
  userId: number,
  tripId: number,
  stopId: number
): Promise<boolean> {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error("Trip not found");
  }

  const result = await pool.query(
    `
      DELETE FROM trip_stops
      WHERE id = $1
        AND trip_id = $2
      RETURNING id
    `,
    [stopId, tripId]
  );

  return result.rowCount === 1;
}