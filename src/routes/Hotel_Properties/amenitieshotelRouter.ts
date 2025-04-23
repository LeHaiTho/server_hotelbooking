import { Router } from "express";
import {get} from "../../controllers/Hotel_Properties/amenitieshotelController"
import { verifyToken, checkRole} from "../../middlewares/auth.middleware";
const router = Router();

router.get('/get-amenities-hotel',verifyToken,checkRole(["quanly"]), get);

export default router;


