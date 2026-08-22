import { Router } from "express";

import {
  getCategories
} from "./category.controller";

const router = Router();

router.get(
  "/",
  getCategories
);

export default router;