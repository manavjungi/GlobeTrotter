import { Router } from "express";

import {
  getMine
} from "./activity.controller";

import {
  authenticate
} from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getMine
);


export default router;