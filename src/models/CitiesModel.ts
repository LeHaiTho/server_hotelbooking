import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import Province from "./ProvincesModel"; // Liên kết với bảng Provinces

class City extends Model {
  public id!: number;
  public name?: string; // Tên thành phố
  public province_id!: number; // ID tỉnh
}

City.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true, // Tự động tăng
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    province_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Province, // Liên kết với bảng Provinces
        key: "id", // Khoá chính trong bảng Provinces
      },
    },
  },
  {
    sequelize: sequelize,
    modelName: "City", // Tên model sẽ ánh xạ đến bảng thành phố trong database
    tableName: "Cities", // Tên bảng trong database
    timestamps: true, // Thêm cột tạo và cập nhật
  }
);
export default City;
