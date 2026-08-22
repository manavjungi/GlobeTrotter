import { pool } from "../../config/database";

export async function getTripItinerary(
  userId: number,
  tripId: number
) {
  // -----------------------------------------
  // 1. Verify trip ownership
  // -----------------------------------------

  const tripResult = await pool.query(
    `
      SELECT
        t.id,
        t.owner_id,
        t.name,
        t.description,
        t.start_date,
        t.end_date,
        t.status,
        t.created_at,
        t.updated_at,

        u.first_name AS owner_first_name,
        u.last_name AS owner_last_name

      FROM trips t

      INNER JOIN users u
        ON u.id = t.owner_id

      WHERE t.id = $1
        AND t.owner_id = $2

      LIMIT 1
    `,
    [tripId, userId]
  );

  if (tripResult.rows.length === 0) {
    throw new Error("Trip not found");
  }

  const trip = tripResult.rows[0];

  // -----------------------------------------
  // 2. Get all stops
  // -----------------------------------------

  const stopsResult = await pool.query(
    `
      SELECT
        ts.id,
        ts.trip_id,
        ts.city_id,
        ts.sequence_no,
        ts.arrival_date,
        ts.departure_date,
        ts.arrival_time,
        ts.departure_time,
        ts.transport_mode,
        ts.transport_cost,
        ts.accommodation_cost,
        ts.notes,

        c.name AS city_name,
        c.slug AS city_slug,
        c.description AS city_description,
        c.short_description AS city_short_description,
        c.latitude AS city_latitude,
        c.longitude AS city_longitude,
        c.timezone AS city_timezone,
        c.image_url AS city_image_url,

        co.id AS country_id,
        co.name AS country_name,
        co.code AS country_code

      FROM trip_stops ts

      INNER JOIN cities c
        ON c.id = ts.city_id

      INNER JOIN countries co
        ON co.id = c.country_id

      WHERE ts.trip_id = $1

      ORDER BY ts.sequence_no ASC
    `,
    [tripId]
  );

  const stops = stopsResult.rows;

  // -----------------------------------------
  // 3. Get all activities
  // -----------------------------------------

  const activitiesResult = await pool.query(
    `
      SELECT
        ta.id,
        ta.trip_id,
        ta.trip_stop_id,
        ta.activity_id,
        ta.activity_date,
        ta.start_time,
        ta.end_time,
        ta.sequence_no,
        ta.estimated_cost,
        ta.actual_cost,
        ta.status,
        ta.notes,

        a.name AS activity_name,
        a.slug AS activity_slug,
        a.description AS activity_description,
        a.duration_minutes,
        a.estimated_cost AS catalog_estimated_cost,
        a.currency AS activity_currency,
        a.latitude AS activity_latitude,
        a.longitude AS activity_longitude,
        a.rating AS activity_rating,
        a.popularity_score AS activity_popularity_score,
        a.image_url AS activity_image_url,
        a.website_url AS activity_website_url,
        a.is_free AS activity_is_free,

        ac.id AS category_id,
        ac.name AS category_name,
        ac.icon AS category_icon

      FROM trip_activities ta

      INNER JOIN activities a
        ON a.id = ta.activity_id

      LEFT JOIN activity_categories ac
        ON ac.id = a.category_id

      WHERE ta.trip_id = $1

      ORDER BY
        ta.activity_date ASC,
        ta.trip_stop_id ASC,
        ta.sequence_no ASC
    `,
    [tripId]
  );

  const activities = activitiesResult.rows;

  // -----------------------------------------
  // 4. Attach activities to stops
  // -----------------------------------------

  const itineraryStops = stops.map(
    (stop) => {
      const stopActivities =
        activities.filter(
          (activity) =>
            Number(activity.trip_stop_id) ===
            Number(stop.id)
        );

      return {
        ...stop,
        activities: stopActivities
      };
    }
  );

  // -----------------------------------------
  // 5. Calculate stop-level budget
  // -----------------------------------------

  const formattedStops =
    itineraryStops.map((stop) => {
      const transportCost =
        Number(stop.transport_cost || 0);

      const accommodationCost =
        Number(
          stop.accommodation_cost || 0
        );

      const activityEstimatedCost =
        stop.activities.reduce(
          (
            total: number,
            activity: any
          ) =>
            total +
            Number(
              activity.estimated_cost || 0
            ),
          0
        );

      const activityActualCost =
        stop.activities.reduce(
          (
            total: number,
            activity: any
          ) =>
            total +
            Number(
              activity.actual_cost || 0
            ),
          0
        );

      return {
        ...stop,

        budget: {
          transportCost,
          accommodationCost,
          activityEstimatedCost,
          activityActualCost,

          estimatedTotal:
            transportCost +
            accommodationCost +
            activityEstimatedCost,

          actualTotal:
            transportCost +
            accommodationCost +
            activityActualCost
        }
      };
    });

  // -----------------------------------------
  // 6. Calculate complete trip budget
  // -----------------------------------------

  const totalTransportCost =
    formattedStops.reduce(
      (
        total: number,
        stop: any
      ) =>
        total +
        Number(
          stop.transport_cost || 0
        ),
      0
    );

  const totalAccommodationCost =
    formattedStops.reduce(
      (
        total: number,
        stop: any
      ) =>
        total +
        Number(
          stop.accommodation_cost || 0
        ),
      0
    );

  const totalActivityEstimatedCost =
    activities.reduce(
      (
        total: number,
        activity: any
      ) =>
        total +
        Number(
          activity.estimated_cost || 0
        ),
      0
    );

  const totalActivityActualCost =
    activities.reduce(
      (
        total: number,
        activity: any
      ) =>
        total +
        Number(
          activity.actual_cost || 0
        ),
      0
    );

  const estimatedTotal =
    totalTransportCost +
    totalAccommodationCost +
    totalActivityEstimatedCost;

  const actualTotal =
    totalTransportCost +
    totalAccommodationCost +
    totalActivityActualCost;

  // -----------------------------------------
  // 7. Return complete itinerary
  // -----------------------------------------

  return {
    trip: {
      id: trip.id,
      title: trip.name,
      description: trip.description,
      startDate: trip.start_date,
      endDate: trip.end_date,
      status: trip.status,

      owner: {
        id: trip.owner_id,
        firstName: trip.owner_first_name,
        lastName: trip.owner_last_name
      },

      createdAt: trip.created_at,
      updatedAt: trip.updated_at
    },

    stops: formattedStops,

    budget: {
      transportCost:
        totalTransportCost,

      accommodationCost:
        totalAccommodationCost,

      activityEstimatedCost:
        totalActivityEstimatedCost,

      activityActualCost:
        totalActivityActualCost,

      estimatedTotal,

      actualTotal
    },

    summary: {
      totalStops:
        formattedStops.length,

      totalActivities:
        activities.length,

      startDate:
        trip.start_date,

      endDate:
        trip.end_date
    }
  };
}