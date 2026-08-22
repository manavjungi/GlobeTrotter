import { pool } from "../../config/database";

export async function getTripBudget(
  userId: number,
  tripId: number
) {
  // -----------------------------------------
  // Verify ownership
  // -----------------------------------------

  const tripResult =
    await pool.query(
      `
        SELECT id
        FROM trips
        WHERE id = $1
          AND owner_id = $2
        LIMIT 1
      `,
      [
        tripId,
        userId
      ]
    );

  if (tripResult.rows.length === 0) {
    throw new Error(
      "Trip not found"
    );
  }


  // -----------------------------------------
  // Stop costs
  // -----------------------------------------

  const stopResult =
    await pool.query(
      `
        SELECT
          COALESCE(
            SUM(transport_cost),
            0
          ) AS transport_cost,

          COALESCE(
            SUM(accommodation_cost),
            0
          ) AS accommodation_cost

        FROM trip_stops

        WHERE trip_id = $1
      `,
      [tripId]
    );

  const stopCosts =
    stopResult.rows[0];


  // -----------------------------------------
  // Activity costs
  // -----------------------------------------

  const activityResult =
    await pool.query(
      `
        SELECT
          COALESCE(
            SUM(estimated_cost),
            0
          ) AS estimated_cost,

          COALESCE(
            SUM(actual_cost),
            0
          ) AS actual_cost

        FROM trip_activities

        WHERE trip_id = $1
      `,
      [tripId]
    );

  const activityCosts =
    activityResult.rows[0];


  // -----------------------------------------
  // Expense costs
  // -----------------------------------------

  const expenseResult =
    await pool.query(
      `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN is_estimated = true
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS estimated_expenses,

          COALESCE(
            SUM(
              CASE
                WHEN is_actual = true
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS actual_expenses

        FROM expenses

        WHERE trip_id = $1
      `,
      [tripId]
    );

  const expenseCosts =
    expenseResult.rows[0];


  // -----------------------------------------
  // Convert numeric values
  // -----------------------------------------

  const transport =
    Number(
      stopCosts.transport_cost || 0
    );

  const accommodation =
    Number(
      stopCosts.accommodation_cost || 0
    );

  const activityEstimated =
    Number(
      activityCosts.estimated_cost || 0
    );

  const activityActual =
    Number(
      activityCosts.actual_cost || 0
    );

  const estimatedExpenses =
    Number(
      expenseCosts.estimated_expenses || 0
    );

  const actualExpenses =
    Number(
      expenseCosts.actual_expenses || 0
    );


  // -----------------------------------------
  // Totals
  // -----------------------------------------

  const estimatedTotal =
    transport +
    accommodation +
    activityEstimated +
    estimatedExpenses;

  const actualTotal =
    transport +
    accommodation +
    activityActual +
    actualExpenses;


  return {
    currency: "INR",

    estimated: {
      transport,
      accommodation,
      activities:
        activityEstimated,
      otherExpenses:
        estimatedExpenses,

      total:
        estimatedTotal
    },

    actual: {
      transport,
      accommodation,
      activities:
        activityActual,
      otherExpenses:
        actualExpenses,

      total:
        actualTotal
    },

    variance:
      estimatedTotal -
      actualTotal
  };
}