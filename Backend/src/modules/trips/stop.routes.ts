import { Router } from "express";

import {
  create,
  getMine,
  update,
  remove
} from "./stop.controller";

import {
  authenticate
} from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post(
  "/:id/stops",
  create
);

router.get(
  "/:id/stops",
  getMine
);

router.put(
  "/:id/stops/:stopId",
  update
);

router.delete(
  "/:id/stops/:stopId",
  remove
);

export default router;