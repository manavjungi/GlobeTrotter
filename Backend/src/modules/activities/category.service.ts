import { pool } from "../../config/database";

export async function getActivityCategories() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      icon
    FROM activity_categories
    ORDER BY name ASC
  `);

  return result.rows;
}