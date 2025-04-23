import { Sequelize } from "sequelize";
import dotenv from "dotenv";
// Tải file .env
dotenv.config();

//lưu ý khi đặt tên biến với các giá trị đặc biệt HOSTNAME dễ trùng với biến môi trường trong máy
const hostname = process.env.HOSTNAMERENDER || "";
const DATABASE = process.env.DATABASE || "";
const USERNAME = process.env.USERNAME || "";
const PASSWORD = process.env.PASSWORD || "";

// liên kết server offline
const sequelize = new Sequelize("hotel_booking", "postgres", "postgres", {
  host: "localhost",
  dialect: "postgres", //loại cơ sở dữ liệu mysql, postgres ...
  logging: false,
});

//Liên kết online
// const sequelize = new Sequelize(DATABASE, USERNAME, PASSWORD, {
//   host: hostname,
//   dialect: "postgres", //loại cơ sở dữ liệu mysql, postgres ...
//   logging: false,
//   dialectOptions: {
//     ssl: {
//       require: true,
//       // Thêm tùy chọn này nếu bạn không có chứng chỉ SSL
//       rejectUnauthorized: false,
//     },
//   },
// });

//Kiểm tra kết nối có thành công không
sequelize
  .authenticate()
  .then(() => {
    console.log("Kết nối với postgreSQL đã được thiết lập thành công.");
  })
  .catch((err) =>
    console.error("Không thể kết nối với cơ sở dữ liệu postgreSQL:", err)
  );

export default sequelize;
