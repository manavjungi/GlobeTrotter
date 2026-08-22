import { pool } from "../../../config/database";

interface CityFilters {
  search?: string;
  countryId?: number;
  featured?: boolean;
}

export async function getCities(
  filters: CityFilters
) {
  const {
    search = "",
    countryId,
    featured
  } = filters;

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.country_id,
        c.name,
        c.state_region,
        c.slug,
        c.description,
        c.short_description,
        c.latitude,
        c.longitude,
        c.timezone,
        c.cost_index,
        c.popularity_score,
        c.image_url,
        c.is_featured,
        c.is_active,

        co.code AS country_code,
        co.name AS country_name

      FROM cities c

      INNER JOIN countries co
        ON co.id = c.country_id

      WHERE
        c.is_active = true

        AND (
          $1 = ''
          OR c.name ILIKE '%' || $1 || '%'
          OR c.slug ILIKE '%' || $1 || '%'
          OR c.state_region ILIKE '%' || $1 || '%'
          OR c.description ILIKE '%' || $1 || '%'
        )

        AND (
          $2::bigint IS NULL
          OR c.country_id = $2
        )

        AND (
          $3::boolean IS NULL
          OR c.is_featured = $3
        )

      ORDER BY
        c.is_featured DESC,
        c.popularity_score DESC,
        c.name ASC

      LIMIT 50
    `,
    [
      search,
      countryId ?? null,
      featured ?? null
    ]
  );

  return result.rows;
}

export async function getCityById(
  cityId: number
) {
  const cityResult = await pool.query(
    `
      SELECT
        c.id,
        c.country_id,
        c.name,
        c.state_region,
        c.slug,
        c.description,
        c.short_description,
        c.latitude,
        c.longitude,
        c.timezone,
        c.cost_index,
        c.popularity_score,
        c.image_url,
        c.is_featured,
        c.is_active,

        co.code AS country_code,
        co.name AS country_name

      FROM cities c

      INNER JOIN countries co
        ON co.id = c.country_id

      WHERE
        c.id = $1
        AND c.is_active = true

      LIMIT 1
    `,
    [cityId]
  );

  if (cityResult.rows.length === 0) {
    throw new Error("City not found");
  }

  const city = cityResult.rows[0];

  const activitiesResult = await pool.query(
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
        a.city_id = $1
        AND a.is_active = true

      ORDER BY
        a.popularity_score DESC,
        a.rating DESC,
        a.name ASC

      LIMIT 50
    `,
    [cityId]
  );

  return {
    ...city,

    activities:
      activitiesResult.rows
  };
}