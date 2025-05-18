import { Router } from "express";
import { getDashboardStats } from "../../controllers/adminC/DashboardController";

const router = Router();

router.get("/stats", getDashboardStats);

export default router;
