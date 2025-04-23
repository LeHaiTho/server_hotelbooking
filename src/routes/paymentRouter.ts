import { Router } from "express";
import paymentController from "../controllers/paymentController";

const router = Router();

router.post("/create", paymentController.create);
router.post("/callback", paymentController.callback);

export default router;
