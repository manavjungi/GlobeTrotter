import { pool } from "../../config/database";

interface CreateExpenseInput {
  tripStopId?: number;
  tripActivityId?: number;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  expenseDate: string;
  isEstimated?: boolean;
  isActual?: boolean;
}

interface UpdateExpenseInput {
  tripStopId?: number;
  tripActivityId?: number;
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  expenseDate?: string;
  isEstimated?: boolean;
  isActual?: boolean;
}


// ============================================
// VERIFY TRIP OWNERSHIP
// ============================================

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

export async function createExpense(
  userId: number,
  tripId: number,
  input: CreateExpenseInput
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


  // -----------------------------------------
  // Verify stop if supplied
  // -----------------------------------------

  if (input.tripStopId) {
    const stopResult =
      await pool.query(
        `
          SELECT id
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
  }


  // -----------------------------------------
  // Verify activity if supplied
  // -----------------------------------------

  if (input.tripActivityId) {
    const activityResult =
      await pool.query(
        `
          SELECT id
          FROM trip_activities
          WHERE id = $1
            AND trip_id = $2
          LIMIT 1
        `,
        [
          input.tripActivityId,
          tripId
        ]
      );

    if (
      activityResult.rows.length === 0
    ) {
      throw new Error(
        "Trip activity not found"
      );
    }
  }


  // -----------------------------------------
  // If activity + stop both supplied,
  // make sure activity belongs to stop
  // -----------------------------------------

  if (
    input.tripActivityId &&
    input.tripStopId
  ) {
    const relationResult =
      await pool.query(
        `
          SELECT id
          FROM trip_activities
          WHERE id = $1
            AND trip_stop_id = $2
          LIMIT 1
        `,
        [
          input.tripActivityId,
          input.tripStopId
        ]
      );

    if (
      relationResult.rows.length === 0
    ) {
      throw new Error(
        "Activity does not belong to selected stop"
      );
    }
  }


  // -----------------------------------------
  // Insert expense
  // -----------------------------------------

  const result =
    await pool.query(
      `
        INSERT INTO expenses (
          trip_id,
          trip_stop_id,
          trip_activity_id,
          user_id,
          category,
          description,
          amount,
          currency,
          expense_date,
          is_estimated,
          is_actual
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
          $10,
          $11
        )
        RETURNING *
      `,
      [
        tripId,
        input.tripStopId ?? null,
        input.tripActivityId ?? null,
        userId,
        input.category,
        input.description,
        input.amount,
        input.currency ?? "INR",
        input.expenseDate,
        input.isEstimated ?? false,
        input.isActual ?? true
      ]
    );

  return result.rows[0];
}

export async function getTripExpenses(
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
          e.*,

          c.name AS city_name,

          a.name AS activity_name

        FROM expenses e

        LEFT JOIN trip_stops ts
          ON ts.id = e.trip_stop_id

        LEFT JOIN cities c
          ON c.id = ts.city_id

        LEFT JOIN trip_activities ta
          ON ta.id = e.trip_activity_id

        LEFT JOIN activities a
          ON a.id = ta.activity_id

        WHERE e.trip_id = $1

        ORDER BY
          e.expense_date ASC,
          e.created_at ASC
      `,
      [tripId]
    );

  return result.rows;
}

export async function updateExpense(
  userId: number,
  tripId: number,
  expenseId: number,
  input: UpdateExpenseInput
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
        FROM expenses
        WHERE id = $1
          AND trip_id = $2
        LIMIT 1
      `,
      [
        expenseId,
        tripId
      ]
    );

  if (
    existingResult.rows.length === 0
  ) {
    throw new Error(
      "Expense not found"
    );
  }

  const current =
    existingResult.rows[0];

  const tripStopId =
    input.tripStopId ??
    current.trip_stop_id;

  const tripActivityId =
    input.tripActivityId ??
    current.trip_activity_id;


  // -----------------------------------------
  // Validate stop
  // -----------------------------------------

  if (tripStopId) {
    const stopResult =
      await pool.query(
        `
          SELECT id
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
  }


  // -----------------------------------------
  // Validate activity
  // -----------------------------------------

  if (tripActivityId) {
    const activityResult =
      await pool.query(
        `
          SELECT id
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
      activityResult.rows.length === 0
    ) {
      throw new Error(
        "Trip activity not found"
      );
    }
  }


  // -----------------------------------------
  // Validate activity ↔ stop relation
  // -----------------------------------------

  if (
    tripActivityId &&
    tripStopId
  ) {
    const relationResult =
      await pool.query(
        `
          SELECT id
          FROM trip_activities
          WHERE id = $1
            AND trip_stop_id = $2
          LIMIT 1
        `,
        [
          tripActivityId,
          tripStopId
        ]
      );

    if (
      relationResult.rows.length === 0
    ) {
      throw new Error(
        "Activity does not belong to selected stop"
      );
    }
  }


  const result =
    await pool.query(
      `
        UPDATE expenses
        SET
          trip_stop_id = $1,
          trip_activity_id = $2,
          category = $3,
          description = $4,
          amount = $5,
          currency = $6,
          expense_date = $7,
          is_estimated = $8,
          is_actual = $9,
          updated_at = NOW()

        WHERE id = $10
          AND trip_id = $11

        RETURNING *
      `,
      [
        tripStopId,
        tripActivityId,
        input.category ??
          current.category,
        input.description ??
          current.description,
        input.amount ??
          current.amount,
        input.currency ??
          current.currency,
        input.expenseDate ??
          current.expense_date,
        input.isEstimated ??
          current.is_estimated,
        input.isActual ??
          current.is_actual,
        expenseId,
        tripId
      ]
    );

  return result.rows[0];
}

export async function deleteExpense(
  userId: number,
  tripId: number,
  expenseId: number
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
        DELETE FROM expenses
        WHERE id = $1
          AND trip_id = $2
        RETURNING id
      `,
      [
        expenseId,
        tripId
      ]
    );

  return result.rowCount === 1;
}