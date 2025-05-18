import { Router } from "express";
import {
  createPriceAdjustment,
  getHotelRoomPriceAdjustments,
} from "../controllers/roomPriceAdjustmentController";

const router = Router();

router.get("/:hotel_id", getHotelRoomPriceAdjustments);
router.post("/", createPriceAdjustment);

export default router;
