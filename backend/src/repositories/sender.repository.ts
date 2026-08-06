import { type Sender } from "@prisma/client";
import { prisma } from "../config/prisma";

export class SenderRepository {
  async findById(id: string): Promise<Sender | null> {
    return prisma.sender.findUnique({
      where: { id }
    });
  }
}
