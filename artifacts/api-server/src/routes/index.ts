import { Router, type IRouter } from "express";
import healthRouter from "./health";
import barberAppRouter from "./barber-app";

const router: IRouter = Router();

router.use(healthRouter);
router.use(barberAppRouter);

export default router;
