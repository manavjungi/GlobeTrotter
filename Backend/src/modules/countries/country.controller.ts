import {
  Request,
  Response
} from "express";

import {
  getCountries
} from "./country.service";

export async function getMine(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const countries =
      await getCountries();

    res.status(200).json({
      success: true,
      data: {
        countries
      }
    });

  } catch (error: any) {
    console.error(
      "Get countries error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch countries"
    });
  }
}