import { Router } from "express";
import { searchLocation } from "../controllers/locationController";

const router = Router();

router.get("/search", searchLocation);

export default router;
