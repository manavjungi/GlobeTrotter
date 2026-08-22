import { Router } from "express";

import {
  getMine,
  getOne
} from "./city.controller";

const router = Router();

router.get(
  "/",
  getMine
);

router.get(
  "/:id",
  getOne
);

export default router;