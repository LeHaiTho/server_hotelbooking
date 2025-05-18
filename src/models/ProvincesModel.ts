import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class Province extends Model {
  public id!: number;
  public code?: string; // Mã tỉnh
  public name?: string; // Tên tỉnh
  public type?: string; // Loại tỉnh (ví dụ: thành phố trực thuộc trung ương, tỉnh...)
  public image?: string; // Hình ảnh tỉnh
}

Province.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true, // Tự động tăng
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    modelName: "Province", // Tên model sẽ ánh xạ đến bảng tỉnh trong database
    tableName: "Provinces", // Tên bảng trong database
    timestamps: true, // Thêm cột tạo và cập nhật
  }
);

export default Province;
