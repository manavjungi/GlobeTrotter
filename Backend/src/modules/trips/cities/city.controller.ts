import {
  Request,
  Response
} from "express";

import {
  getCities,
  getCityById
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

    const countryId =
      req.query.countryId
        ? Number(req.query.countryId)
        : undefined;

    const featured =
      req.query.featured !== undefined
        ? req.query.featured === "true"
        : undefined;

    if (
      countryId !== undefined &&
      !Number.isInteger(countryId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid country ID"
      });

      return;
    }

    const cities =
      await getCities({
        search,
        countryId,
        featured
      });

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


export async function getOne(
  req: Request,
  res: Response
): Promise<void> {
  try {

    const cityId =
      Number(req.params.id);

    if (!Number.isInteger(cityId)) {
      res.status(400).json({
        success: false,
        message: "Invalid city ID"
      });

      return;
    }

    const city =
      await getCityById(cityId);

    res.status(200).json({
      success: true,
      data: {
        city
      }
    });

  } catch (error: any) {

    console.error(
      "Get city error:",
      error
    );

    const status =
      error.message ===
      "City not found"
        ? 404
        : 500;

    res.status(status).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch city"
    });
  }
}