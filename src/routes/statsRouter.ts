import express from "express";
import { getHotelStats } from "../controllers/statsController";

const router = express.Router();

router.get("/hotel/:hotelId", getHotelStats);

export default router;
