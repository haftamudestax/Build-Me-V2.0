import { Router } from "express";
import bookingsRouter from './bookings.routes';

const router = Router();

router.use("/bookings", bookingsRouter);

export default router;