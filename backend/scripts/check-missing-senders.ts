import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ override: true });

const prisma = new PrismaClient();

async function main() {
  const senders = await prisma.sender.findMany({ select: { id: true, email: true } });
  const senderIds = new Set(senders.map((sender) => sender.id));

  const jobs = await prisma.emailJob.findMany({
    select: { id: true, senderId: true, recipient: true, subject: true, status: true },
    orderBy: { createdAt: "asc" }
  });

  const badJobs = jobs.filter((job) => !senderIds.has(job.senderId));

  console.log("Senders:", JSON.stringify(senders, null, 2));
  console.log(`Total jobs: ${jobs.length}`);
  console.log(`Jobs with missing sender: ${badJobs.length}`);
  if (badJobs.length > 0) {
    console.log(JSON.stringify(badJobs.slice(0, 50), null, 2));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
