import { Router } from "express";
import {
  createBooking,
  getBookingId,
  getUpcomingBookings,
  getBookingByStatus,
  cancelBooking,
  sendBookingConfirmationEmailManually,
  updatePaymentStatus,
  sendBookingReminder,
  getRevenueReport,
} from "../controllers/bookingController";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/cancel", cancelBooking);
router.get("/filter", verifyToken, getBookingByStatus);
router.get("/upcoming", verifyToken, getUpcomingBookings);
router.get("/:id", getBookingId);
router.post("/", createBooking);
router.get("/revenue/:hotelId", getRevenueReport);

// Thêm route mới để gửi email xác nhận đặt phòng
router.post(
  "/send-confirmation-email/:bookingId",
  sendBookingConfirmationEmailManually
);

// Thêm route cập nhật trạng thái thanh toán
router.post("/payment/update-status", updatePaymentStatus);

// Thêm route mới để gửi email nhắc lịch thủ công
router.post("/send-reminder/:bookingId", sendBookingReminder);

export default router;
