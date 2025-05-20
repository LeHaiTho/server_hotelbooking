import { Router } from "express";
import {
  createPriceAdjustment,
  getHotelRoomPriceAdjustments,
  getRoomPriceAdjustments,
} from "../controllers/roomPriceAdjustmentController";

const router = Router();

router.get("/:hotel_id", getHotelRoomPriceAdjustments);
router.get("/:hotel_id/room/:room_id", getRoomPriceAdjustments);
router.post("/", createPriceAdjustment);

export default router;
