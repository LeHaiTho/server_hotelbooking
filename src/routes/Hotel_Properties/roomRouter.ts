import { Router } from "express";
import {
  create,
  get,
  getRooms,
  updateBed_Room,
  getRoomsById,
  getRoomByIdHotelMobile,
  checkRoomForUpdate,
  checkAndUpdateBookingSchedule,
} from "../../controllers/Hotel_Properties/roomController";
import { verifyToken, checkRole } from "../../middlewares/auth.middleware";
const router = Router();

router.post("/room/check-room-availability", checkRoomForUpdate);
router.post(
  "/room/update-booking-schedule",
  verifyToken,
  checkAndUpdateBookingSchedule
);
router.get("/room/get-rooms", verifyToken, checkRole(["quanly"]), getRooms);
// router.get("/room/:hotelId", getRoomByIdHotel);
router.get("/room/by-hotel/:hotelId", getRoomByIdHotelMobile);

router.post(
  "/room/create/:idhotel",
  verifyToken,
  checkRole(["quanly"]),
  create
);
router.get(
  "/room/get-roombeds/:idhotel",
  verifyToken,
  checkRole(["quanly"]),
  get
);
router.get(
  "/room/get-rooms/:idhotel",
  verifyToken,
  checkRole(["quanly"]),
  getRooms
);

//lấy ra phòng theo id
router.get(
  "/room/get-rooms-update/:idroom",
  verifyToken,
  checkRole(["quanly"]),
  getRoomsById
);
//Lấy phòng để cập nhật
router.post(
  "/room/get-rooms-update/update-room/:idroom",
  verifyToken,
  checkRole(["quanly"]),
  updateBed_Room
);
export default router;
