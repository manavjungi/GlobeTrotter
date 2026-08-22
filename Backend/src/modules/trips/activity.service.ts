import { pool } from "../../config/database";

interface CreateActivityInput {
  tripStopId: number;
  activityId: number;
  activityDate: string;
  startTime?: string;
  endTime?: string;
  sequenceNo?: number;
  estimatedCost?: number;
  actualCost?: number;
  status?: string;
  notes?: string;
}

interface UpdateActivityInput {
  tripStopId?: number;
  activityId?: number;
  activityDate?: string;
  startTime?: string;
  endTime?: string;
  sequenceNo?: number;
  estimatedCost?: number;
  actualCost?: number;
  status?: string;
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

export async function createTripActivity(
  userId: number,
  tripId: number,
  input: CreateActivityInput
) {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error(
      "Trip not found"
    );
  }

  // Verify that the stop belongs to this trip
  const stopResult =
    await pool.query(
      `
        SELECT
          id,
          city_id,
          arrival_date,
          departure_date
        FROM trip_stops
        WHERE id = $1
          AND trip_id = $2
        LIMIT 1
      `,
      [
        input.tripStopId,
        tripId
      ]
    );

  if (stopResult.rows.length === 0) {
    throw new Error(
      "Trip stop not found"
    );
  }

  const stop =
    stopResult.rows[0];

  // Verify master activity exists
  const activityResult =
    await pool.query(
      `
        SELECT
          id,
          city_id,
          name,
          estimated_cost,
          is_active
        FROM activities
        WHERE id = $1
          AND is_active = true
        LIMIT 1
      `,
      [input.activityId]
    );

  if (activityResult.rows.length === 0) {
    throw new Error(
      "Activity not found"
    );
  }

  const activity =
    activityResult.rows[0];

  // Activity should belong to the same city
  if (
    Number(activity.city_id) !==
    Number(stop.city_id)
  ) {
    throw new Error(
      "Activity does not belong to the selected city"
    );
  }

  // Activity date should fall within stop dates
  const activityDate =
    new Date(input.activityDate);

  const arrivalDate =
    new Date(stop.arrival_date);

  const departureDate =
    new Date(stop.departure_date);

  if (
    activityDate < arrivalDate ||
    activityDate > departureDate
  ) {
    throw new Error(
      "Activity date must be within the stop dates"
    );
  }

  // Validate time range
  if (
    input.startTime &&
    input.endTime &&
    input.endTime <= input.startTime
  ) {
    throw new Error(
      "End time must be after start time"
    );
  }

  const result =
    await pool.query(
      `
        INSERT INTO trip_activities (
          trip_id,
          trip_stop_id,
          activity_id,
          activity_date,
          start_time,
          end_time,
          sequence_no,
          estimated_cost,
          actual_cost,
          status,
          notes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          COALESCE(
            $7,
            (
              SELECT COALESCE(
                MAX(sequence_no) + 1,
                1
              )
              FROM trip_activities
              WHERE trip_stop_id = $2
                AND activity_date = $4
            )
          ),
          $8,
          $9,
          $10,
          $11
        )
        RETURNING *
      `,
      [
        tripId,
        input.tripStopId,
        input.activityId,
        input.activityDate,
        input.startTime ?? null,
        input.endTime ?? null,
        input.sequenceNo ?? null,
        input.estimatedCost ??
          activity.estimated_cost ??
          0,
        input.actualCost ?? null,
        input.status ??
          "planned",
        input.notes ?? null
      ]
    );

  return result.rows[0];
}

export async function getTripActivities(
  userId: number,
  tripId: number
) {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error(
      "Trip not found"
    );
  }

  const result =
    await pool.query(
      `
        SELECT
          ta.*,

          a.name AS activity_name,
          a.slug AS activity_slug,
          a.description AS activity_description,
          a.duration_minutes,
          a.image_url AS activity_image_url,
          a.rating AS activity_rating,
          a.latitude AS activity_latitude,
          a.longitude AS activity_longitude,

          ac.name AS category_name,

          ts.sequence_no AS stop_sequence_no,

          c.name AS city_name

        FROM trip_activities ta

        INNER JOIN activities a
          ON a.id = ta.activity_id

        LEFT JOIN activity_categories ac
          ON ac.id = a.category_id

        INNER JOIN trip_stops ts
          ON ts.id = ta.trip_stop_id

        INNER JOIN cities c
          ON c.id = ts.city_id

        WHERE ta.trip_id = $1

        ORDER BY
          ta.activity_date ASC,
          ts.sequence_no ASC,
          ta.sequence_no ASC
      `,
      [tripId]
    );

  return result.rows;
}

export async function updateTripActivity(
  userId: number,
  tripId: number,
  tripActivityId: number,
  input: UpdateActivityInput
) {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error(
      "Trip not found"
    );
  }

  const existingResult =
    await pool.query(
      `
        SELECT *
        FROM trip_activities
        WHERE id = $1
          AND trip_id = $2
        LIMIT 1
      `,
      [
        tripActivityId,
        tripId
      ]
    );

  if (
    existingResult.rows.length === 0
  ) {
    throw new Error(
      "Trip activity not found"
    );
  }

  const current =
    existingResult.rows[0];

  const tripStopId =
    input.tripStopId ??
    current.trip_stop_id;

  const activityId =
    input.activityId ??
    current.activity_id;

  const activityDate =
    input.activityDate ??
    current.activity_date;

  const startTime =
    input.startTime ??
    current.start_time;

  const endTime =
    input.endTime ??
    current.end_time;

  const sequenceNo =
    input.sequenceNo ??
    current.sequence_no;

  const estimatedCost =
    input.estimatedCost ??
    current.estimated_cost;

  const actualCost =
    input.actualCost ??
    current.actual_cost;

  const status =
    input.status ??
    current.status;

  const notes =
    input.notes ??
    current.notes;

  // Verify stop belongs to trip
  const stopResult =
    await pool.query(
      `
        SELECT
          id,
          city_id,
          arrival_date,
          departure_date
        FROM trip_stops
        WHERE id = $1
          AND trip_id = $2
        LIMIT 1
      `,
      [
        tripStopId,
        tripId
      ]
    );

  if (stopResult.rows.length === 0) {
    throw new Error(
      "Trip stop not found"
    );
  }

  const stop =
    stopResult.rows[0];

  // Verify activity
  const activityResult =
    await pool.query(
      `
        SELECT
          id,
          city_id,
          is_active
        FROM activities
        WHERE id = $1
          AND is_active = true
        LIMIT 1
      `,
      [activityId]
    );

  if (
    activityResult.rows.length === 0
  ) {
    throw new Error(
      "Activity not found"
    );
  }

  const activity =
    activityResult.rows[0];

  if (
    Number(activity.city_id) !==
    Number(stop.city_id)
  ) {
    throw new Error(
      "Activity does not belong to the selected city"
    );
  }

  const activityDateObj =
    new Date(activityDate);

  if (
    activityDateObj <
      new Date(stop.arrival_date) ||
    activityDateObj >
      new Date(stop.departure_date)
  ) {
    throw new Error(
      "Activity date must be within the stop dates"
    );
  }

  if (
    startTime &&
    endTime &&
    endTime <= startTime
  ) {
    throw new Error(
      "End time must be after start time"
    );
  }

  const result =
    await pool.query(
      `
        UPDATE trip_activities
        SET
          trip_stop_id = $1,
          activity_id = $2,
          activity_date = $3,
          start_time = $4,
          end_time = $5,
          sequence_no = $6,
          estimated_cost = $7,
          actual_cost = $8,
          status = $9,
          notes = $10,
          updated_at = NOW()

        WHERE id = $11
          AND trip_id = $12

        RETURNING *
      `,
      [
        tripStopId,
        activityId,
        activityDate,
        startTime,
        endTime,
        sequenceNo,
        estimatedCost,
        actualCost,
        status,
        notes,
        tripActivityId,
        tripId
      ]
    );

  return result.rows[0];
}

export async function deleteTripActivity(
  userId: number,
  tripId: number,
  tripActivityId: number
): Promise<boolean> {
  const ownsTrip =
    await verifyTripOwnership(
      userId,
      tripId
    );

  if (!ownsTrip) {
    throw new Error(
      "Trip not found"
    );
  }

  const result =
    await pool.query(
      `
        DELETE FROM trip_activities
        WHERE id = $1
          AND trip_id = $2
        RETURNING id
      `,
      [
        tripActivityId,
        tripId
      ]
    );

  return result.rowCount === 1;
}