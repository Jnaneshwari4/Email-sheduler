import { Router } from "express";
import authRouter from "./auth.routes";
import healthRouter from "./health.routes";
import profileRouter from "./profile.routes";
import queueRouter from "./queue.routes";

const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(profileRouter);
apiRouter.use(queueRouter);

export default apiRouter;
