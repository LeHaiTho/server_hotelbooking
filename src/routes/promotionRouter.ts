import { Router } from "express";
import {
  createPromotion,
  getPromotions,
  applyPromotion,
  getHotelPromotions,
} from "../controllers/promotionController";

const promotionRouter = Router();

promotionRouter.post("/", createPromotion);
promotionRouter.post("/apply", applyPromotion);
promotionRouter.get("/hotel/:hotel_id", getHotelPromotions);
promotionRouter.get("/", getPromotions);
export default promotionRouter;
