import { Router } from "express";

import {
  getMine
} from "./country.controller";

const router = Router();

router.get("/", getMine);

export default router;