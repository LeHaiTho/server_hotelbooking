import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import cors from "cors";
import {
  User,
  Role,
  Hotel,
  Amenities_Hotel,
  Type_Hotel,
  TypeRoom,
  Bed,
  Room_Bed,
  Room,
  RoomPrice,
  BookingHotel,
  BookingDetail,
  BookingHistory,
  Province,
  City,
  RoomPriceAdjustment,
  Promotion,
  BookingDetailPromotion,
  Rating,
} from "./models";
import {
  manageRouter,
  typeHotelRouter,
  amenitiesHotelRouter,
  hotelRouter,
  roomRouter,
  roompriceRouter,
  bookingRouter,
  paymentRouter,
  locationRouter,
  bookingallRouter,
  dashboardRouter,
} from "./routes";
import userRouter from "./routes/auth/userRouter";
import roomPriceAdjustmentRouter from "./routes/roomPriceAdjustmentRouter";
import promotionRouter from "./routes/promotionRouter";
import ratingRouter from "./routes/ratingRouter";
import statsRouter from "./routes/statsRouter";

const app = express();

//cấu hình dịch request json từ client hoặc body-parser
app.use(express.json());

// Cấu hình các middeware bảo mật cơ bản
app.use(hpp()); //bảo vệ khỏi các cuộc tấn công http
app.use(helmet()); //Bảo mật HTTP Headers
app.use(morgan("tiny")); //Log các request HTTP gửi đến server

// Sử dụng middleware CORS
app.use(
  cors({
    origin: "*", // Tạm thời cho phép tất cả origin để kiểm tra
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // credentials: true
  })
);
// app.use(
//   cors({
//     origin: true, // Tạm thời cho phép tất cả origin để kiểm tra
//     credentials: true,
//   })
// );
// app.use(cors());

//phân tích các đối tượng phức tạp, như các đối tượng lồng nhau hoặc mảng
//ví dụ khi sử dụng với formsubmit
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.removeHeader("Cross-Origin-Opener-Policy");
  next();
});

//Đồng bộ Model lên CSDL
// User.sync();
// Role.sync();
// Hotel.sync();
// Amenities_Hotel.sync();
// Type_Hotel.sync();
// TypeRoom.sync();
// Bed.sync();
// Room_Bed.sync();
// Room.sync();
// RoomPrice.sync();
// BookingHotel.sync();
// BookingDetail.sync();
// BookingHistory.sync();
// Province.sync();
// City.sync();
// RoomPriceAdjustment.sync();
// Promotion.sync();
// BookingDetailPromotion.sync();
// Rating.sync();
//cấu hình các router cần thiết
app.use("/auth", manageRouter);
app.use("/auth", userRouter);
//Hotel - Properties - CRUD

app.use("/hotel-properties", typeHotelRouter);
app.use("/hotel-properties", amenitiesHotelRouter);
app.use("/hotel-properties", hotelRouter);
app.use("/hotel-properties", roomRouter);
// app.use("/hotel-properties", roompriceRouter);
app.use("/rooms", roompriceRouter);
//Booking - CRUD
app.use("/booking", bookingRouter);
app.use("/payment", paymentRouter);
//Location - Search
app.use("/location", locationRouter);
// Room Price Adjustment - giá phòng tăng theo ngày cuối tuần, lễ, tết
app.use("/room-price-adjustment", roomPriceAdjustmentRouter);
// Promotion - khuyến mãi
app.use("/promotion", promotionRouter);
// Add the rating router
app.use("/ratings", ratingRouter);

//admin
app.use("/admin", bookingallRouter);
app.use("/admin/dashboard", dashboardRouter);
app.use("/stats", statsRouter);
export default app;
