import {
  Request,
  Response
} from "express";

import {
  getActivities
} from "./activity.service";

export async function getMine(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const cityId =
      req.query.cityId
        ? Number(req.query.cityId)
        : undefined;

    const categoryId =
      req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined;

    if (
      cityId !== undefined &&
      !Number.isInteger(cityId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid city ID"
      });

      return;
    }

    if (
      categoryId !== undefined &&
      !Number.isInteger(categoryId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });

      return;
    }

    const activities =
      await getActivities({
        search,
        cityId,
        categoryId
      });

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

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch activities"
    });
  }
}