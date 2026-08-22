import { Router } from "express";

import {
  create,
  getMine,
  getOne
} from "./trip.controller";

import {
  authenticate
} from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  create
);

router.get(
  "/",
  getMine
);

router.get(
  "/:id",
  getOne
);

export default router;