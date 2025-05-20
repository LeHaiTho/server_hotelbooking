import { Router } from "express";
import {
  loginWithGoogle,
  getInfoUser,
  getUser,
  getAllUsers,
  getUserDetails,
  getHotelManagerDetails,
} from "../../controllers/auth/userController";
import { verifyToken } from "../../middlewares/auth.middleware";
const router = Router();

router.post("/login-with-google", loginWithGoogle);
router.get("/get-info-user", verifyToken, getInfoUser);
//lấy danh sách thành viên theo quyền
router.get("/user/get-info/:role_name", getUser);

// API mới
router.get("/users/all", getAllUsers); // Lấy tất cả người dùng với vai trò
router.get("/users/details/:userId", getUserDetails); // Chi tiết người dùng thông thường
router.get("/users/hotel-manager/:userId", getHotelManagerDetails); // Chi tiết quản lý khách sạn

export default router;
