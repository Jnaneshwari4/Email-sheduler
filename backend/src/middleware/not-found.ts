import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../utils/app-error";

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
