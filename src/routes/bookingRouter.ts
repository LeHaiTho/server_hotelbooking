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
  checkInBooking,
} from "../controllers/bookingController";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/cancel", cancelBooking);
router.get("/filter", verifyToken, getBookingByStatus);
router.get("/upcoming", verifyToken, getUpcomingBookings);
router.get("/:id", getBookingId);
router.post("/", verifyToken, createBooking);
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

// Thêm route mới để check-in (chuyển trạng thái từ PENDING sang CONFIRMED)
router.post("/check-in/:bookingId", checkInBooking);

export default router;
