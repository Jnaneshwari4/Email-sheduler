import { Router } from "express";
import { getQueueHealth } from "../controllers/queue-health.controller";
import { asyncHandler } from "../utils/async-handler";

const queueRouter = Router();

queueRouter.get("/queues/health", asyncHandler(getQueueHealth));

export default queueRouter;
