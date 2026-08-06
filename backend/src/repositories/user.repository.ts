import { type User } from "@prisma/client";
import { prisma } from "../config/prisma";

type UpsertGoogleUserInput = {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
};

export class UserRepository {
  async upsertGoogleUser(input: UpsertGoogleUserInput): Promise<User> {
    return prisma.user.upsert({
      where: { email: input.email },
      update: {
        googleId: input.googleId,
        name: input.name,
        avatar: input.avatar
      },
      create: {
        googleId: input.googleId,
        email: input.email,
        name: input.name,
        avatar: input.avatar
      }
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  }
}
