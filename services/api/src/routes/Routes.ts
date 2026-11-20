import { Router } from "express";
import bookingsRouter from './bookings.routes';
import referralsRouter from "./referrals";
import feedbackRouter from "./feedback.routes";

const router = Router();

router.use("/bookings", bookingsRouter);
router.use("/referrals", referralsRouter);
router.use("/feedback", feedbackRouter);

export default router;