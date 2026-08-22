import { pool } from "../../config/database";

export async function getCountries() {
  const result = await pool.query(
    `
      SELECT
        id,
        code,
        name
      FROM countries
      ORDER BY name ASC
    `
  );

  return result.rows;
}