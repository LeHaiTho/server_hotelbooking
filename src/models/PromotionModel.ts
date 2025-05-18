import { Model, DataTypes } from "sequelize";
import sequelize from "../config/sequelize";
import Hotel from "./HotelModel";
import Room from "./Room";

// Khuyến mãi
class Promotion extends Model {
  public id!: number;
  public id_hotel?: number;
  public name?: string;
  public description?: string;
  public discount_type?: string;
  public discount_value?: number;
  public start_date?: Date;
  public end_date?: Date;
  public min_stay?: number;
  public booking_days_in_advance?: number;
  public is_active?: boolean;
}
Promotion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_hotel: {
      type: DataTypes.INTEGER,
      allowNull: true, // NULL cho khuyến mãi hệ thống
      references: {
        model: Hotel,
        key: "id",
      },
    },
    id_room: {
      type: DataTypes.INTEGER,
      allowNull: true, // NULL cho khuyến mãi hệ thống
      references: {
        model: Room,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    discount_type: {
      type: DataTypes.ENUM("PERCENTAGE", "FIXED"),
    },
    discount_value: {
      type: DataTypes.DECIMAL,
    },
    start_date: {
      type: DataTypes.DATEONLY,
    },
    end_date: {
      type: DataTypes.DATEONLY,
    },
    min_stay: {
      type: DataTypes.INTEGER,
    },
    booking_days_in_advance: {
      type: DataTypes.INTEGER,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Trạng thái khuyến mãi
    },
  },
  {
    sequelize,
    modelName: "Promotion",
    tableName: "Promotion",
    timestamps: true,
  }
);

export default Promotion;
