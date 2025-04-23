import { Router } from "express";
import {get} from "../../controllers/Hotel_Properties/typehotelController"
import { verifyToken, checkRole} from "../../middlewares/auth.middleware";
const router = Router();

router.get('/get-type-hotel',verifyToken,checkRole(["quanly"]), get);

export default router;


