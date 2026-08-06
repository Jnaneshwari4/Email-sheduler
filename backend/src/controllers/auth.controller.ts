import { type Request, type Response } from "express";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/app-error";

const authService = new AuthService(new UserRepository());

export async function loginWithGoogle(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body as { idToken: string };

  const result = await authService.loginWithGoogleIdToken(idToken);

  res.status(200).json({
    success: true,
    data: result
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  res.status(200).json({
    success: true,
    data: {
      message: "Logged out successfully"
    }
  });
}
