import { Router } from "express";

import {
  getMine
} from "./itinerary.controller";

import {
  authenticate
} from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/:id/itinerary",
  getMine
);

export default router;