import { type EmailJob, EmailJobStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export class EmailJobRepository {
  async create(input: Omit<EmailJob, "sentAt" | "updatedAt">): Promise<void> {
    await prisma.emailJob.create({
      data: input
    });
  }

  async findByUserAndStatus(userId: string, status: EmailJobStatus): Promise<EmailJob[]> {
    return prisma.emailJob.findMany({
      where: {
        userId,
        status
      },
      orderBy: {
        scheduledAt: "asc"
      }
    });
  }

  async findById(emailJobId: string): Promise<EmailJob | null> {
    return prisma.emailJob.findUnique({
      where: {
        id: emailJobId
      }
    });
  }

  async deleteById(emailJobId: string): Promise<void> {
    await prisma.emailJob.delete({
      where: {
        id: emailJobId
      }
    });
  }

  async markProcessing(emailJobId: string): Promise<void> {
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailJobStatus.PROCESSING
      }
    });
  }

  async markSent(emailJobId: string): Promise<void> {
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailJobStatus.SENT,
        sentAt: new Date()
      }
    });
  }

  async markFailed(emailJobId: string): Promise<void> {
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailJobStatus.FAILED
      }
    });
  }

  async markScheduled(emailJobId: string, scheduledAt: Date): Promise<void> {
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailJobStatus.SCHEDULED,
        scheduledAt
      }
    });
  }
}
