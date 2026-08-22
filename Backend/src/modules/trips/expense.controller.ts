import {
  Request,
  Response
} from "express";

import {
  createExpenseSchema,
  updateExpenseSchema
} from "./expense.validation";

import {
  createExpense,
  getTripExpenses,
  updateExpense,
  deleteExpense
} from "./expense.service";

import {
  getTripBudget
} from "./budget.service";


// ============================================
// CREATE
// ============================================

export async function create(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });

      return;
    }

    const tripId =
      Number(req.params.id);

    if (!Number.isInteger(tripId)) {
      res.status(400).json({
        success: false,
        message: "Invalid trip ID"
      });

      return;
    }

    const data =
      createExpenseSchema.parse(
        req.body
      );

    const expense =
      await createExpense(
        req.user.userId,
        tripId,
        data
      );

    res.status(201).json({
      success: true,
      message:
        "Expense created successfully",
      data: {
        expense
      }
    });

  } catch (error: any) {
    console.error(
      "Create expense error:",
      error
    );

    const notFoundMessages = [
      "Trip not found",
      "Trip stop not found",
      "Trip activity not found"
    ];

    const status =
      notFoundMessages.includes(
        error.message
      )
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to create expense"
    });
  }
}


// ============================================
// GET EXPENSES
// ============================================

export async function getMine(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });

      return;
    }

    const tripId =
      Number(req.params.id);

    if (!Number.isInteger(tripId)) {
      res.status(400).json({
        success: false,
        message: "Invalid trip ID"
      });

      return;
    }

    const expenses =
      await getTripExpenses(
        req.user.userId,
        tripId
      );

    res.status(200).json({
      success: true,
      data: {
        expenses
      }
    });

  } catch (error: any) {
    console.error(
      "Get expenses error:",
      error
    );

    const status =
      error.message ===
      "Trip not found"
        ? 404
        : 500;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch expenses"
    });
  }
}


// ============================================
// UPDATE
// ============================================

export async function update(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });

      return;
    }

    const tripId =
      Number(req.params.id);

    const expenseId =
      Number(req.params.expenseId);

    if (
      !Number.isInteger(tripId) ||
      !Number.isInteger(expenseId)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid trip or expense ID"
      });

      return;
    }

    const data =
      updateExpenseSchema.parse(
        req.body
      );

    const expense =
      await updateExpense(
        req.user.userId,
        tripId,
        expenseId,
        data
      );

    res.status(200).json({
      success: true,
      message:
        "Expense updated successfully",
      data: {
        expense
      }
    });

  } catch (error: any) {
    console.error(
      "Update expense error:",
      error
    );

    const notFoundMessages = [
      "Trip not found",
      "Expense not found",
      "Trip stop not found",
      "Trip activity not found"
    ];

    const status =
      notFoundMessages.includes(
        error.message
      )
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to update expense"
    });
  }
}


// ============================================
// DELETE
// ============================================

export async function remove(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });

      return;
    }

    const tripId =
      Number(req.params.id);

    const expenseId =
      Number(req.params.expenseId);

    if (
      !Number.isInteger(tripId) ||
      !Number.isInteger(expenseId)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid trip or expense ID"
      });

      return;
    }

    const deleted =
      await deleteExpense(
        req.user.userId,
        tripId,
        expenseId
      );

    if (!deleted) {
      res.status(404).json({
        success: false,
        message:
          "Expense not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Expense deleted successfully"
    });

  } catch (error: any) {
    console.error(
      "Delete expense error:",
      error
    );

    const status =
      error.message ===
      "Trip not found"
        ? 404
        : 500;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to delete expense"
    });
  }
}


// ============================================
// BUDGET
// ============================================

export async function budget(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });

      return;
    }

    const tripId =
      Number(req.params.id);

    if (!Number.isInteger(tripId)) {
      res.status(400).json({
        success: false,
        message: "Invalid trip ID"
      });

      return;
    }

    const result =
      await getTripBudget(
        req.user.userId,
        tripId
      );

    res.status(200).json({
      success: true,
      data: {
        budget: result
      }
    });

  } catch (error: any) {
    console.error(
      "Get budget error:",
      error
    );

    const status =
      error.message ===
      "Trip not found"
        ? 404
        : 500;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch budget"
    });
  }
}