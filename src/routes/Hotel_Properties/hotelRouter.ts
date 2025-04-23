import { Router } from "express";
import {
  create,
  getHotelRegisters,
  createImage,
  getImageHotel,
  findNearestHotels,
  getHotelById,
} from "../../controllers/Hotel_Properties/hotelController";
import { verifyToken, checkRole } from "../../middlewares/auth.middleware";
import { uploadRoom } from "../../middlewares/upload/index";
const router = Router();

router.post("/hotel-create", verifyToken, checkRole(["quanly"]), create);

router.post(
  "/hotel/register-isboolean/:id_user",
  verifyToken,
  checkRole(["quanly"]),
  getHotelRegisters
);

router.post(
  "/hotel/create-image/:idhotel",
  uploadRoom.array("images", 10),
  verifyToken,
  checkRole(["quanly"]),
  createImage
);

// router.get("/searchresults", findNearestHotels);
router.get("/searchresults", findNearestHotels);

//Lấy hình ảnh của khách sạn
router.get("/hotel/get-image/:idhotel/:thumbnail", getImageHotel);

// lấy khách sạn theo id
router.get("/hotel/:id", getHotelById);
export default router;
