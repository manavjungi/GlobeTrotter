import { Router } from "express";

import authRoutes
  from "../modules/auth/auth.routes";

import tripRoutes
  from "../modules/trips/trip.routes";
  
import stopRoutes
  from "../modules/trips/stop.routes";

import activityRoutes
  from "../modules/trips/activity.routes";

import itineraryRoutes
  from "../modules/trips/itinerary.routes";


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

router.use(
  "/trips",
  activityRoutes
);

router.use(
  "/trips",
  itineraryRoutes
);

export default router;