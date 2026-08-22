import {
  Request,
  Response
} from "express";

import {
  createTripSchema,
  updateTripSchema
} from "./trip.validation";

import {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip
} from "./trip.service";

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

    const data =
      createTripSchema.parse(
        req.body
      );

    const trip =
      await createTrip(
        req.user.userId,
        data
      );

    res.status(201).json({
      success: true,
      message:
        "Trip created successfully",
      data: {
        trip
      }
    });

  } catch (error: any) {
    console.error(error);

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create trip"
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

    const trips =
      await getUserTrips(
        req.user.userId
      );

    res.status(200).json({
      success: true,
      data: {
        trips
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch trips"
    });
  }
}

export async function getOne(
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

    const trip =
      await getTripById(
        req.user.userId,
        tripId
      );

    if (!trip) {
      res.status(404).json({
        success: false,
        message: "Trip not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: {
        trip
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch trip"
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

    if (!Number.isInteger(tripId)) {
      res.status(400).json({
        success: false,
        message: "Invalid trip ID"
      });

      return;
    }

    const data =
      updateTripSchema.parse(
        req.body
      );

    const trip =
      await updateTrip(
        req.user.userId,
        tripId,
        data
      );

    res.status(200).json({
      success: true,
      message:
        "Trip updated successfully",
      data: {
        trip
      }
    });

  } catch (error: any) {
    console.error(error);

    const status =
      error.message === "Trip not found"
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to update trip"
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

    if (!Number.isInteger(tripId)) {
      res.status(400).json({
        success: false,
        message: "Invalid trip ID"
      });

      return;
    }

    const deleted =
      await deleteTrip(
        req.user.userId,
        tripId
      );

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Trip not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Trip deleted successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to delete trip"
    });
  }
}