import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import Room from "./Room";

class RoomPriceAdjustment extends Model {
  public id!: number;
  public id_room!: number;
  public start_date!: Date;
  public end_date!: Date;
  public adjustment_type!: string;
  public adjustment_value!: number;
  public reason?: string;
  public apply_to_days!: number[];
}
// (Điều chỉnh giá phòng
RoomPriceAdjustment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_room: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Room,
        key: "id",
      },
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    adjustment_type: {
      type: DataTypes.ENUM("PERCENTAGE", "FIXED"),
      allowNull: false,
    },
    adjustment_value: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apply_to_days: {
      type: DataTypes.JSON, // Hoặc TEXT nếu database không hỗ trợ JSON
      allowNull: true,
      // defaultValue: [0, 1, 2, 3, 4, 5, 6], // Mặc định áp dụng cho tất cả các ngày
    },
  },
  {
    sequelize,
    modelName: "RoomPriceAdjustment",
    tableName: "RoomPriceAdjustment",
    timestamps: true,
  }
);

export default RoomPriceAdjustment;
