import { Router } from "express";
import {
  get,
  getAmenities,
} from "../../controllers/Hotel_Properties/amenitieshotelController";
import { verifyToken, checkRole } from "../../middlewares/auth.middleware";
const router = Router();

router.get("/get-amenities-hotel", verifyToken, checkRole(["quanly"]), get);
router.get("/amenities", getAmenities);
export default router;
