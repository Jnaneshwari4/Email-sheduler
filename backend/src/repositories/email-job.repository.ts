import { EmailJobStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export class EmailJobRepository {
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
