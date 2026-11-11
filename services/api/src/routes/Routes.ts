import { Router } from "express";
import bookingsRouter from './bookings.routes';
import referralsRouter from "./referrals";

const router = Router();

router.use("/bookings", bookingsRouter);
router.use("/referrals", referralsRouter);

export default router;