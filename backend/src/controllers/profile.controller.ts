import { type Request, type Response } from "express";
import { ProfileService } from "../services/profile.service";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/app-error";

const profileService = new ProfileService(new UserRepository());

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const profile = await profileService.getProfileByUserId(req.user.id);

  res.status(200).json({
    success: true,
    data: profile
  });
}
