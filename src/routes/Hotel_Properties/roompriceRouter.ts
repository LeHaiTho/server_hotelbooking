import { Router } from "express";
import {create, getbyTyperoom} from "../../controllers/Hotel_Properties/roompriceController"
import { verifyToken, checkRole} from "../../middlewares/auth.middleware";
const router = Router();

router.post('/roomprice/create',verifyToken,checkRole(["quanly"]), create);
router.post('/roomprice/get-by-typeroom',verifyToken,checkRole(["quanly"]), getbyTyperoom);


export default router;


