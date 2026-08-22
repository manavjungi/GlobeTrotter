import {
  Request,
  Response
} from "express";

import {

  
  getCities
} from "./city.service";

export async function getMine(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const cities =
      await getCities(search);

    res.status(200).json({
      success: true,
      data: {
        cities
      }
    });

  } catch (error: any) {
    console.error(
      "Get cities error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch cities"
    });
  }
}