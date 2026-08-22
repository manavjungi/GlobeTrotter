import { Router } from "express";

import {
  create,
  getMine,
  update,
  remove,
  budget
} from "./expense.controller";

import {
  authenticate
} from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post(
  "/:id/expenses",
  create
);

router.get(
  "/:id/expenses",
  getMine
);

router.put(
  "/:id/expenses/:expenseId",
  update
);

router.delete(
  "/:id/expenses/:expenseId",
  remove
);

router.get(
  "/:id/budget",
  budget
);

export default router;