import app from "./app";
import { env } from "./config/env";
import { checkDatabaseConnection } from "./config/database";
import { runPendingMigrations } from "./database/migrator.js";

async function startServer() {
  try {
    await checkDatabaseConnection();
    await runPendingMigrations();

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(
        `Server running at http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();