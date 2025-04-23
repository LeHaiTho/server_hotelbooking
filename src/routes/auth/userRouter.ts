import { Router } from "express";
import {
  loginWithGoogle,
  getInfoUser,
} from "../../controllers/auth/userController";
import { verifyToken } from "../../middlewares/auth.middleware";
const router = Router();

router.post("/login-with-google", loginWithGoogle);
router.get("/get-info-user", verifyToken, getInfoUser);

export default router;
