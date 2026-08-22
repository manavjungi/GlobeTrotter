import { pool } from "../../config/database";

interface CreateTripInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
  visibility?: string;
  coverImageUrl?: string;
}

interface UpdateTripInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  visibility?: string;
  coverImageUrl?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(
  name: string
): Promise<string> {
  const baseSlug = generateSlug(name);

  if (!baseSlug) {
    throw new Error(
      "Trip name must contain valid characters"
    );
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const result = await pool.query(
      `
        SELECT id
        FROM trips
        WHERE slug = $1
        LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
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

  const slug =
    await generateUniqueSlug(input.name);

  const result = await pool.query(
    `
      INSERT INTO trips (
        owner_id,
        name,
        slug,
        description,
        cover_image_url,
        start_date,
        end_date,
        budget,
        currency,
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
        $8,
        $9,
        $10
      )
      RETURNING *
    `,
    [
      userId,
      input.name,
      slug,
      input.description ?? null,
      input.coverImageUrl ?? null,
      input.startDate,
      input.endDate,
      input.budget ?? 0,
      input.currency ?? "INR",
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

  const currency =
    input.currency ??
    existingTrip.currency;

  const visibility =
    input.visibility ??
    existingTrip.visibility;

  const coverImageUrl =
    input.coverImageUrl ??
    existingTrip.cover_image_url;

  if (
    new Date(endDate) <
    new Date(startDate)
  ) {
    throw new Error(
      "End date cannot be before start date"
    );
  }

  let slug = existingTrip.slug;

  if (
    input.name &&
    input.name !== existingTrip.name
  ) {
    slug =
      await generateUniqueSlug(
        input.name
      );
  }

  const result = await pool.query(
    `
      UPDATE trips
      SET
        name = $1,
        slug = $2,
        description = $3,
        cover_image_url = $4,
        start_date = $5,
        end_date = $6,
        budget = $7,
        currency = $8,
        visibility = $9,
        updated_at = NOW()
      WHERE id = $10
        AND owner_id = $11
      RETURNING *
    `,
    [
      name,
      slug,
      description,
      coverImageUrl,
      startDate,
      endDate,
      budget,
      currency,
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