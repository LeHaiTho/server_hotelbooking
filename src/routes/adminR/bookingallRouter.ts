import { Router } from "express";
import {
  getBookingall,
  getBookinghotel,
  thongkehotel,
  thongkeloaihotel,
  doiSoatDoanhThu,
  doiSoatDoanhThuTheoThang,
  sendReconciliationReport,
} from "../../controllers/adminC/BookingAllController";
const router = Router();

router.get("/booking-all", getBookingall);
router.get("/booking-all-hotel", getBookinghotel);
router.get("/thongke-hotel", thongkehotel);
router.get("/thongke-loai-hotel", thongkeloaihotel);
router.get("/doi-soat-doanh-thu", doiSoatDoanhThu);
router.get("/doi-soat-doanh-thu-theo-thang", doiSoatDoanhThuTheoThang);
router.post("/send-reconciliation-report", sendReconciliationReport);

export default router;
