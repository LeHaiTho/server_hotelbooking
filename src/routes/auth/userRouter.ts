import { Router } from "express";
import {
  loginWithGoogle,
  getInfoUser,
  getUser,
} from "../../controllers/auth/userController";
import { verifyToken } from "../../middlewares/auth.middleware";
const router = Router();

router.post("/login-with-google", loginWithGoogle);
router.get("/get-info-user", verifyToken, getInfoUser);
//lấy danh sách thành viên theo quyền
router.get("/user/get-info/:role_name", getUser);

export default router;
