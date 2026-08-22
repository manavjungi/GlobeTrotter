import {
  Request,
  Response
} from "express";

import {
  getActivityCategories
} from "./category.service";

export async function getCategories(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const categories =
      await getActivityCategories();

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error: any) {
    console.error(
      "Get activity categories error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch activity categories"
    });
  }
}