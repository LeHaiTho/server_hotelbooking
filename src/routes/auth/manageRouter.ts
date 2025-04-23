import { Router } from "express";
import { registerManager,login,test } from "../../controllers/auth/manageController";
const router = Router();

//Đăng ký tài khoản cho quản lý
router.post('/register', registerManager)
//Đăng nhập
router.post('/login', login)

//Test API
router.get('/test',test);

export default router