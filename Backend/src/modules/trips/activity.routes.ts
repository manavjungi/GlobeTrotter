import { Router } from "express";

import {
  create,
  getMine,
  update,
  remove
} from "./activity.controller";

import {
  authenticate
} from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post(
  "/:id/activities",
  create
);

router.get(
  "/:id/activities",
  getMine
);

router.put(
  "/:id/activities/:activityId",
  update
);

router.delete(
  "/:id/activities/:activityId",
  remove
);

export default router;