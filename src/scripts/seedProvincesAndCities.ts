import axios from "axios";
import { Province, City } from "../models"; // Giả sử bạn đã xuất khẩu models từ các file tương ứng
import sequelize from "../config/sequelize";

async function fetchAndSaveProvincesAndCities() {
  try {
    // Gửi yêu cầu tới API
    const response = await axios.get(
      "https://provinces.open-api.vn/api/?depth=3"
    );

    const provincesData = response.data;

    // Duyệt qua danh sách tỉnh và thành phố
    for (const province of provincesData) {
      // Lưu tỉnh vào CSDL
      const provinceRecord = await Province.create({
        code: province.code,
        name: province.name,
        type: province.type,
      });

      // Lưu thành phố tương ứng vào CSDL
      if (province.districts) {
        for (const city of province.districts) {
          await City.create({
            name: city.name,
            province_id: provinceRecord.id, // Liên kết với tỉnh
          });
        }
      }
    }

    console.log("Dữ liệu tỉnh và thành phố đã được lưu thành công!");
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu từ API:", error);
  }
}

// Gọi hàm để lấy dữ liệu và lưu vào cơ sở dữ liệu
fetchAndSaveProvincesAndCities();
