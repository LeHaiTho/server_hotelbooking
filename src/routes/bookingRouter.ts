import { Router } from "express";
import {
  createBooking,
  getBookingId,
  getUpcomingBookings,
  getBookingByStatus,
  cancelBooking,
} from "../controllers/bookingController";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/cancel", cancelBooking);
router.get("/filter", verifyToken, getBookingByStatus);
router.get("/upcoming", verifyToken, getUpcomingBookings);
router.get("/:id", getBookingId);
router.post("/", createBooking);
export default router;
