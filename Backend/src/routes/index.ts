import { Router } from "express";

import authRoutes
  from "../modules/auth/auth.routes";

import tripRoutes
  from "../modules/trips/trip.routes";
  
import stopRoutes
  from "../modules/trips/stop.routes";

const router = Router();

router.use(
  "/auth",
  authRoutes
);

router.use(
  "/trips",
  tripRoutes
);

router.use(
  "/trips",
  stopRoutes
);

export default router;