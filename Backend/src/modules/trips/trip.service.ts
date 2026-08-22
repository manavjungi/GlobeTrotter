import { pool } from "../../config/database";

interface CreateTripInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currencyId?: number;
  visibility?: string;
}

interface UpdateTripInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currencyId?: number;
  visibility?: string;
}

export async function createTrip(
  userId: number,
  input: CreateTripInput
) {
  if (
    new Date(input.endDate) <
    new Date(input.startDate)
  ) {
    throw new Error(
      "End date cannot be before start date"
    );
  }

  const result = await pool.query(
    `
      INSERT INTO trips (
        owner_id,
        name,
        description,
        start_date,
        end_date,
        budget,
        currency_id,
        visibility
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      RETURNING *
    `,
    [
      userId,
      input.name,
      input.description ?? null,
      input.startDate,
      input.endDate,
      input.budget ?? 0,
      input.currencyId ?? null,
      input.visibility ?? "private"
    ]
  );

  return result.rows[0];
}

export async function getUserTrips(
  userId: number
) {
  const result = await pool.query(
    `
      SELECT
        t.*,

        (
          SELECT COUNT(*)
          FROM trip_stops ts
          WHERE ts.trip_id = t.id
        ) AS stop_count,

        (
          SELECT COUNT(*)
          FROM trip_activities ta
          WHERE ta.trip_id = t.id
        ) AS activity_count

      FROM trips t

      WHERE t.owner_id = $1

      ORDER BY
        t.start_date DESC,
        t.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

export async function getTripById(
  userId: number,
  tripId: number
) {
  const result = await pool.query(
    `
      SELECT
        t.*
      FROM trips t
      WHERE t.id = $1
        AND t.owner_id = $2
      LIMIT 1
    `,
    [
      tripId,
      userId
    ]
  );

  return result.rows[0] ?? null;
}

export async function updateTrip(
  userId: number,
  tripId: number,
  input: UpdateTripInput
) {
  const existingTrip =
    await getTripById(
      userId,
      tripId
    );

  if (!existingTrip) {
    throw new Error(
      "Trip not found"
    );
  }

  const name =
    input.name ??
    existingTrip.name;

  const description =
    input.description ??
    existingTrip.description;

  const startDate =
    input.startDate ??
    existingTrip.start_date;

  const endDate =
    input.endDate ??
    existingTrip.end_date;

  const budget =
    input.budget ??
    existingTrip.budget;

  const currencyId =
    input.currencyId ??
    existingTrip.currency_id;

  const visibility =
    input.visibility ??
    existingTrip.visibility;

  if (
    new Date(endDate) <
    new Date(startDate)
  ) {
    throw new Error(
      "End date cannot be before start date"
    );
  }

  const result = await pool.query(
    `
      UPDATE trips
      SET
        name = $1,
        description = $2,
        start_date = $3,
        end_date = $4,
        budget = $5,
        currency_id = $6,
        visibility = $7,
        updated_at = NOW()
      WHERE id = $8
        AND owner_id = $9
      RETURNING *
    `,
    [
      name,
      description,
      startDate,
      endDate,
      budget,
      currencyId,
      visibility,
      tripId,
      userId
    ]
  );

  return result.rows[0];
}

export async function deleteTrip(
  userId: number,
  tripId: number
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM trips
      WHERE id = $1
        AND owner_id = $2
      RETURNING id
    `,
    [
      tripId,
      userId
    ]
  );

  return result.rowCount === 1;
}