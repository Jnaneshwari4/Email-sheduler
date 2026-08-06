import { Router } from "express";
import { getProfile } from "../controllers/profile.controller";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/async-handler";

const profileRouter = Router();

profileRouter.get("/profile", authenticate, asyncHandler(getProfile));

export default profileRouter;
