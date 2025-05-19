import { Router } from "express";
import {
  createPromotion,
  getPromotions,
  applyPromotion,
  getHotelPromotions,
  deletePromotion,
  updatePromotion,
} from "../controllers/promotionController";

const promotionRouter = Router();

promotionRouter.post("/", createPromotion);
promotionRouter.post("/apply", applyPromotion);
promotionRouter.get("/hotel/:hotel_id", getHotelPromotions);
promotionRouter.get("/", getPromotions);
promotionRouter.put("/:id", updatePromotion);
promotionRouter.delete("/:id", deletePromotion);

export default promotionRouter;
