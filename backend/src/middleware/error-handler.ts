import { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../utils/app-error";

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      details: err.flatten()
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
    return;
  }

  logger.error("Unhandled server error", {
    error: err instanceof Error ? err.message : "Unknown error"
  });

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === "production" ? "Internal server error" : "Unexpected server error"
  });
}
