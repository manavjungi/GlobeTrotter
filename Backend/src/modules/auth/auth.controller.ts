import { Request, Response } from "express";

import {
  registerSchema,
  loginSchema
} from "./auth.validation";

import {
  registerUser,
  loginUser,
  getCurrentUser
} from "./auth.service";

export async function register(
  req: Request,
  res: Response
) {
  try {

    const data =
      registerSchema.parse(req.body);

    const result =
      await registerUser(data);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message:
        error.message || "Registration failed"
    });

  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {

    const data =
      loginSchema.parse(req.body);

    const result =
      await loginUser(data);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });

  } catch (error: any) {

    return res.status(401).json({
      success: false,
      message:
        error.message || "Login failed"
    });

  }
}

export async function me(
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

    const user =
      await getCurrentUser(
        req.user.userId
      );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch user"
    });
  }
}