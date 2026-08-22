import { Router } from "express";

import authRoutes
  from "../modules/auth/auth.routes";

import tripRoutes
  from "../modules/trips/trip.routes";

const router = Router();

router.use(
  "/auth",
  authRoutes
);

router.use(
  "/trips",
  tripRoutes
);

export default router;