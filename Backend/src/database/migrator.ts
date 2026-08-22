import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/database.js";

/**
 * Unique advisory lock key for GlobeTrotter database migrations.
 * Prevents concurrent backend instances from running migrations simultaneously.
 */
const ADVISORY_LOCK_KEY = 839201948273645;

/**
 * Resolves the absolute path to the database migrations directory.
 */
async function getMigrationsDir(): Promise<string> {
  const primaryPath = path.resolve(process.cwd(), "database", "migrations");
  try {
    await fs.access(primaryPath);
    return primaryPath;
  } catch {
    return path.resolve(__dirname, "../../database/migrations");
  }
}

/**
 * Discovers and executes pending PostgreSQL migrations in deterministic order.
 * Wraps each migration in an individual transaction and manages advisory locking.
 */
export async function runPendingMigrations(): Promise<void> {
  console.log("[DB] Checking migrations...");

  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query("SELECT pg_advisory_lock($1)", [ADVISORY_LOCK_KEY]);
    lockAcquired = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = await getMigrationsDir();

    let files: string[] = [];
    try {
      files = await fs.readdir(migrationsDir);
    } catch {
      files = [];
    }

    const sqlFiles = files
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    const result = await client.query<{ name: string }>(
      "SELECT name FROM schema_migrations"
    );
    const appliedSet = new Set(result.rows.map((row) => row.name));

    const pendingFiles = sqlFiles.filter((file) => !appliedSet.has(file));

    if (pendingFiles.length === 0) {
      console.log("[DB] No pending migrations");
      return;
    }

    for (const file of pendingFiles) {
      console.log(`[DB] Applying migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`[DB] Migration applied: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`[DB] Migration failed: ${file}`);
        throw error;
      }
    }
  } finally {
    if (lockAcquired) {
      try {
        await client.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
      } catch (unlockErr) {
        console.error("[DB] Failed to release advisory lock:", unlockErr);
      }
    }
    client.release();
  }
}
