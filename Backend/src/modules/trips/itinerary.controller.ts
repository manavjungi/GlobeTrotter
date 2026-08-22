import {
  Request,
  Response
} from "express";

import {
  getTripItinerary
} from "./itinerary.service";

export async function getMine(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // -----------------------------------------
    // Authentication check
    // -----------------------------------------

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });

      return;
    }

    // -----------------------------------------
    // Validate trip ID
    // -----------------------------------------

    const tripId =
      Number(req.params.id);

    if (!Number.isInteger(tripId)) {
      res.status(400).json({
        success: false,
        message: "Invalid trip ID"
      });

      return;
    }

    // -----------------------------------------
    // Get itinerary
    // -----------------------------------------

    const itinerary =
      await getTripItinerary(
        req.user.userId,
        tripId
      );

    // -----------------------------------------
    // Response
    // -----------------------------------------

    res.status(200).json({
      success: true,
      data: itinerary
    });

  } catch (error: any) {
    console.error(
      "Get itinerary error:",
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
        "Failed to fetch itinerary"
    });
  }
}