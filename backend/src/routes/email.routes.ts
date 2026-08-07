import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticate } from "../middleware/authenticate";
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  deleteScheduledEmail,
  deleteScheduledEmails
} from "../controllers/email.controller";

const emailRouter = Router();

emailRouter.post("/emails/schedule", authenticate, asyncHandler(scheduleEmails));
emailRouter.get("/emails/scheduled", authenticate, asyncHandler(getScheduledEmails));
emailRouter.get("/emails/sent", authenticate, asyncHandler(getSentEmails));
emailRouter.delete("/emails/scheduled/:id", authenticate, asyncHandler(deleteScheduledEmail));
emailRouter.post("/emails/scheduled/delete", authenticate, asyncHandler(deleteScheduledEmails));

export default emailRouter;
