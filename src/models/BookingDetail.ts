import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import BookingHotel from "./BookingHotel";
import Room from "./Room";

class BookingDetail extends Model {
  public id!: number;
  public id_booking_hotel!: number;
  public id_room!: number;
  public checkin_date?: Date;
  public checkout_date?: Date;
  public price?: number;
  public quantity?: number;
  public status?: string;
}
BookingDetail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_booking_hotel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BookingHotel,
        key: "id",
      },
    },
    id_room: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Room,
        key: "id",
      },
    },
    checkin_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    checkout_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED"),
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: "BookingDetail",
    tableName: "BookingDetail",
    timestamps: true,
  }
);

export default BookingDetail;
