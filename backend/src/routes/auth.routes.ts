import { Router } from "express";
import { loginWithGoogle, logout } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/async-handler";
import { validateRequest } from "../middleware/validate-request";
import { googleAuthRequestSchema } from "../validators/auth.validator";
import { authenticate } from "../middleware/authenticate";

const authRouter = Router();

authRouter.post("/auth/google", validateRequest(googleAuthRequestSchema), asyncHandler(loginWithGoogle));
authRouter.post("/auth/logout", authenticate, asyncHandler(logout));

export default authRouter;
