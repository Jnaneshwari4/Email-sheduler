import { Router } from "express";
import authRouter from "./auth.routes";
import emailRouter from "./email.routes";
import healthRouter from "./health.routes";
import profileRouter from "./profile.routes";
import queueRouter from "./queue.routes";
import senderRouter from "./sender.routes";

const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(senderRouter);
apiRouter.use(emailRouter);
apiRouter.use(profileRouter);
apiRouter.use(queueRouter);

export default apiRouter;
