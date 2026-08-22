import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env";
import apiRoutes from "./routes/index";
import activityRoutes from "./modules/activity/activity.routes";

const app = express();

app.use(
  helmet()
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  "/api/v1",
  apiRoutes
);

app.use("/api/activities", activityRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "GlobeTrotter API is running",
    environment: env.NODE_ENV
  });
});

export default app;