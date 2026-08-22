import { pool } from "../../config/database";

export async function getCities(search?: string) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.short_description,
        c.latitude,
        c.longitude,
        c.timezone,
        c.image_url,

        co.id AS country_id,    
        co.name AS country_name,
        co.code AS country_code

      FROM cities c

      INNER JOIN countries co
        ON co.id = c.country_id

      WHERE
        $1 = ''
        OR c.name ILIKE '%' || $1 || '%'
        OR c.slug ILIKE '%' || $1 || '%'
        OR c.description ILIKE '%' || $1 || '%'

      ORDER BY c.name ASC

      LIMIT 50
    `,
    [search || ""]
  );

  return result.rows;
}