import { type Request, type Response } from "express";

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
}
