import { type Request, type Response } from "express";
import { SenderRepository } from "../repositories/sender.repository";
import { AppError } from "../utils/app-error";

const senderRepository = new SenderRepository();

export async function getSenders(_req: Request, res: Response): Promise<void> {
  const senders = await senderRepository.findAll();

  res.status(200).json({
    success: true,
    data: senders
  });
}

export async function createSender(req: Request, res: Response): Promise<void> {
  const { email, smtpHost, smtpPort, smtpUser, smtpPassEnc } = req.body as {
    email: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassEnc: string;
  };

  if (!email || !smtpHost || !smtpPort || !smtpUser || !smtpPassEnc) {
    throw new AppError("Missing sender data", 400);
  }

  const sender = await senderRepository.create({
    email,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassEnc
  });

  res.status(201).json({
    success: true,
    data: sender
  });
}
