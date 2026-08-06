import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/app-error";

export class ProfileService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfileByUserId(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: Date;
  }> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    };
  }
}
