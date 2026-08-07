import { z } from "zod";

export const scheduleEmailRequestSchema = z.object({
  body: z.object({
    senderId: z.string().min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
    recipients: z.array(z.string().email()).min(1),
    startTime: z.string().min(1),
    delaySeconds: z.coerce.number().int().positive(),
    hourlyLimit: z.coerce.number().int().positive()
  })
});
