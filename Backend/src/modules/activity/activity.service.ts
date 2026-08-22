import { pool } from "../../config/database";

interface ActivityFilters {
  search?: string;
  cityId?: number;
  categoryId?: number;
}

export async function getActivities(
  filters: ActivityFilters
) {
  const {
    search = "",
    cityId,
    categoryId
  } = filters;

  const result = await pool.query(
    `
      SELECT
        a.id,
        a.name,
        a.slug,
        a.description,
        a.duration_minutes,
        a.estimated_cost,
        a.currency,
        a.latitude,
        a.longitude,
        a.rating,
        a.popularity_score,
        a.image_url,
        a.website_url,
        a.is_free,

        ac.id AS category_id,
        ac.name AS category_name,
        ac.icon AS category_icon

      FROM activities a

      LEFT JOIN activity_categories ac
        ON ac.id = a.category_id

      WHERE
        (
          $1 = ''
          OR a.name ILIKE '%' || $1 || '%'
          OR a.slug ILIKE '%' || $1 || '%'
          OR a.description ILIKE '%' || $1 || '%'
        )

        AND (
          $2::bigint IS NULL
          OR EXISTS (
            SELECT 1
            FROM city_activities ca
            WHERE ca.activity_id = a.id
              AND ca.city_id = $2
          )
        )

        AND (
          $3::bigint IS NULL
          OR a.category_id = $3
        )

      ORDER BY
        a.popularity_score DESC NULLS LAST,
        a.rating DESC NULLS LAST,
        a.name ASC

      LIMIT 50
    `,
    [
      search,
      cityId ?? null,
      categoryId ?? null
    ]
  );

  return result.rows;
}