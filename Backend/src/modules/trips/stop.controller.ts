import {
  Request,
  Response
} from "express";

import {
  createStopSchema,
  updateStopSchema
} from "./stop.validation";

import {
  createStop,
  getTripStops,
  updateStop,
  deleteStop
} from "./stop.service";


// ============================================
// CREATE STOP
// POST /api/v1/trips/:id/stops
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
      createStopSchema.parse(
        req.body
      );

    const stop =
      await createStop(
        req.user.userId,
        tripId,
        data
      );

    res.status(201).json({
      success: true,
      message:
        "Trip stop created successfully",
      data: {
        stop
      }
    });

  } catch (error: any) {
    console.error(
      "Create stop error:",
      error
    );

    const status =
      error.message ===
      "Trip not found"
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to create stop"
    });
  }
}


// ============================================
// GET ALL STOPS
// GET /api/v1/trips/:id/stops
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

    const stops =
      await getTripStops(
        req.user.userId,
        tripId
      );

    res.status(200).json({
      success: true,
      data: {
        stops
      }
    });

  } catch (error: any) {
    console.error(
      "Get stops error:",
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
        "Failed to fetch stops"
    });
  }
}


// ============================================
// UPDATE STOP
// PUT /api/v1/trips/:id/stops/:stopId
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

    const stopId =
      Number(req.params.stopId);

    if (
      !Number.isInteger(tripId) ||
      !Number.isInteger(stopId)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid trip or stop ID"
      });

      return;
    }

    const data =
      updateStopSchema.parse(
        req.body
      );

    const stop =
      await updateStop(
        req.user.userId,
        tripId,
        stopId,
        data
      );

    res.status(200).json({
      success: true,
      message:
        "Trip stop updated successfully",
      data: {
        stop
      }
    });

  } catch (error: any) {
    console.error(
      "Update stop error:",
      error
    );

    let status = 400;

    if (
      error.message ===
      "Trip not found" ||
      error.message ===
      "Stop not found"
    ) {
      status = 404;
    }

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to update stop"
    });
  }
}


// ============================================
// DELETE STOP
// DELETE /api/v1/trips/:id/stops/:stopId
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

    const stopId =
      Number(req.params.stopId);

    if (
      !Number.isInteger(tripId) ||
      !Number.isInteger(stopId)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid trip or stop ID"
      });

      return;
    }

    const deleted =
      await deleteStop(
        req.user.userId,
        tripId,
        stopId
      );

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Stop not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Trip stop deleted successfully"
    });

  } catch (error: any) {
    console.error(
      "Delete stop error:",
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
        "Failed to delete stop"
    });
  }
}