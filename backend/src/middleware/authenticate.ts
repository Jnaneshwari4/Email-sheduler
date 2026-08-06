import { type NextFunction, type Request, type Response } from "express";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/app-error";

const authService = new AuthService(new UserRepository());

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;

  if (!authorization) {
    next(new AppError("Authorization header is required", 401));
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new AppError("Authorization format must be: Bearer <token>", 401));
    return;
  }

  const payload = authService.verifyAccessToken(token);

  req.user = {
    id: payload.userId,
    email: payload.email
  };

  next();
}
