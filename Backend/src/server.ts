import app from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./config/database.js";

async function startServer() {
  try {
    await checkDatabaseConnection();

    app.listen(env.PORT, () => {
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