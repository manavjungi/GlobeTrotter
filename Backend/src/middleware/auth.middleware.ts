import {
  Request,
  Response,
  NextFunction
} from "express";

import {
  verifyAccessToken
} from "../utils/jwt";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      res.status(401).json({
        success: false,
        message:
          "Authorization token is required"
      });

      return;
    }

    const [scheme, token] =
      authorization.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      res.status(401).json({
        success: false,
        message:
          "Invalid authorization format"
      });

      return;
    }

    const payload =
      verifyAccessToken(token);

    req.user = payload;

    next();

  } catch {
    res.status(401).json({
      success: false,
      message:
        "Invalid or expired token"
    });
  }
}