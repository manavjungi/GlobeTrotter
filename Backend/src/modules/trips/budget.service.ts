import { pool } from "../../config/database";

export async function getTripBudget(
  userId: number,
  tripId: number
) {
  // ============================================
  // VERIFY TRIP OWNERSHIP + GET BUDGET/CURRENCY
  // ============================================

  const tripResult = await pool.query(
    `
      SELECT
        id,
        budget,
        currency
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
    throw new Error("Trip not found");
  }

  const trip = tripResult.rows[0];

  const allocatedBudget = Number(
    trip.budget || 0
  );

  const currency =
    String(trip.currency || "INR").trim();


  // ============================================
  // STOP COSTS
  // ============================================

  const stopResult = await pool.query(
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

  const stopCosts = stopResult.rows[0];


  // ============================================
  // ACTIVITY COSTS
  // ============================================

  const activityResult = await pool.query(
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


  // ============================================
  // EXPENSE COSTS
  // ============================================

  const expenseResult = await pool.query(
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


  // ============================================
  // CONVERT NUMERIC VALUES
  // ============================================

  const transport = Number(
    stopCosts.transport_cost || 0
  );

  const accommodation = Number(
    stopCosts.accommodation_cost || 0
  );

  const activityEstimated = Number(
    activityCosts.estimated_cost || 0
  );

  const activityActual = Number(
    activityCosts.actual_cost || 0
  );

  const estimatedExpenses = Number(
    expenseCosts.estimated_expenses || 0
  );

  const actualExpenses = Number(
    expenseCosts.actual_expenses || 0
  );


  // ============================================
  // CALCULATE TOTALS
  // ============================================

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


  // ============================================
  // REMAINING BUDGET
  // ============================================

  const estimatedRemaining =
    allocatedBudget -
    estimatedTotal;

  const actualRemaining =
    allocatedBudget -
    actualTotal;


  // ============================================
  // VARIANCE
  // ============================================

  const variance =
    estimatedTotal -
    actualTotal;


  // ============================================
  // RETURN BUDGET SUMMARY
  // ============================================

  return {
    currency,

    allocatedBudget,

    estimated: {
      transport,
      accommodation,
      activities: activityEstimated,
      otherExpenses: estimatedExpenses,
      total: estimatedTotal
    },

    actual: {
      transport,
      accommodation,
      activities: activityActual,
      otherExpenses: actualExpenses,
      total: actualTotal
    },

    remaining: {
      estimated: estimatedRemaining,
      actual: actualRemaining
    },

    variance
  };
}