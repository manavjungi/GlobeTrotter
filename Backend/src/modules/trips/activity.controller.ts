import {
  Request,
  Response
} from "express";

import {
  createActivitySchema,
  updateActivitySchema
} from "./activity.validation";

import {
  createTripActivity,
  getTripActivities,
  updateTripActivity,
  deleteTripActivity
} from "./activity.service";

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
      createActivitySchema.parse(
        req.body
      );

    const activity =
      await createTripActivity(
        req.user.userId,
        tripId,
        data
      );

    res.status(201).json({
      success: true,
      message:
        "Activity added to trip successfully",
      data: {
        activity
      }
    });

  } catch (error: any) {
    console.error(
      "Create activity error:",
      error
    );

    const notFoundMessages = [
      "Trip not found",
      "Trip stop not found",
      "Activity not found"
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
        "Failed to add activity"
    });
  }
}

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

    const activities =
      await getTripActivities(
        req.user.userId,
        tripId
      );

    res.status(200).json({
      success: true,
      data: {
        activities
      }
    });

  } catch (error: any) {
    console.error(
      "Get activities error:",
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
        "Failed to fetch activities"
    });
  }
}

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

    const activityId =
      Number(req.params.activityId);

    if (
      !Number.isInteger(tripId) ||
      !Number.isInteger(activityId)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid trip or activity ID"
      });

      return;
    }

    const data =
      updateActivitySchema.parse(
        req.body
      );

    const activity =
      await updateTripActivity(
        req.user.userId,
        tripId,
        activityId,
        data
      );

    res.status(200).json({
      success: true,
      message:
        "Trip activity updated successfully",
      data: {
        activity
      }
    });

  } catch (error: any) {
    console.error(
      "Update activity error:",
      error
    );

    const notFoundMessages = [
      "Trip not found",
      "Trip activity not found",
      "Trip stop not found",
      "Activity not found"
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
        "Failed to update activity"
    });
  }
}

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

    const activityId =
      Number(req.params.activityId);

    if (
      !Number.isInteger(tripId) ||
      !Number.isInteger(activityId)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid trip or activity ID"
      });

      return;
    }

    const deleted =
      await deleteTripActivity(
        req.user.userId,
        tripId,
        activityId
      );

    if (!deleted) {
      res.status(404).json({
        success: false,
        message:
          "Trip activity not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Trip activity deleted successfully"
    });

  } catch (error: any) {
    console.error(
      "Delete activity error:",
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
        "Failed to delete activity"
    });
  }
}