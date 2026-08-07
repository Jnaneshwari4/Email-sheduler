import { type Sender } from "@prisma/client";
import { prisma } from "../config/prisma";

export class SenderRepository {
  async findById(id: string): Promise<Sender | null> {
    return prisma.sender.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<Sender | null> {
    return prisma.sender.findUnique({
      where: { email }
    });
  }

  async findAll(): Promise<Sender[]> {
    return prisma.sender.findMany({
      orderBy: { createdAt: "asc" }
    });
  }

  async create(input: {
    email: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassEnc: string;
  }): Promise<Sender> {
    return prisma.sender.create({
      data: input
    });
  }

  async updateById(id: string, input: {
    email?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassEnc?: string;
  }): Promise<Sender> {
    return prisma.sender.update({
      where: { id },
      data: input
    });
  }

  async reassignJobs(fromSenderId: string, toSenderId: string): Promise<number> {
    const result = await prisma.emailJob.updateMany({
      where: { senderId: fromSenderId },
      data: { senderId: toSenderId }
    });

    return result.count;
  }

  async deleteById(id: string): Promise<Sender> {
    return prisma.sender.delete({
      where: { id }
    });
  }
}
