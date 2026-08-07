import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticate } from "../middleware/authenticate";
import { createSender, getSenders } from "../controllers/sender.controller";

const senderRouter = Router();

senderRouter.get("/senders", authenticate, asyncHandler(getSenders));
senderRouter.post("/senders", authenticate, asyncHandler(createSender));

export default senderRouter;
