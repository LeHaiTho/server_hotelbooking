import { Router } from "express";
import {
  createRating,
  getHotelRatings,
  getUnratedHotels,
  getHotelOwnerRatings,
  hideRating,
  deleteRating,
  getRatedHotels,
  getAllUserHotels,
  checkRating,
} from "../controllers/ratingController";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Tạo đánh giá mới
router.post("/", verifyToken, createRating);

// Lấy đánh giá của một khách sạn
router.get("/hotel/:hotelId", getHotelRatings);

// Lấy danh sách khách sạn chưa đánh giá của người dùng
router.get("/unrated", verifyToken, getUnratedHotels);

// Lấy đánh giá cho các khách sạn của chủ khách sạn
// router.get("/hotel-owner", verifyToken, getHotelOwnerRatings);
router.get("/hotel-owner", verifyToken, getHotelOwnerRatings);

// Ẩn đánh giá (đánh dấu là đã xóa)
router.put("/hide/:ratingId", verifyToken, hideRating);

// Xóa đánh giá vĩnh viễn
router.delete("/:ratingId", verifyToken, deleteRating);

// Thêm route mới
router.get("/rated", verifyToken, getRatedHotels);

// Thêm route mới để lấy cả hai loại khách sạn
router.get("/user-hotels", verifyToken, getAllUserHotels);

// Thêm route mới để kiểm tra đánh giá
router.get("/check-rating/:hotelId/:bookingId", verifyToken, checkRating);

export default router;
