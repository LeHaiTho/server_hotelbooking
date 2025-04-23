import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class BookingHistory extends Model {}

BookingHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_booking_hotel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "BookingHotel",
        key: "id",
      },
    },
    id_booking_detail: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "BookingDetail",
        key: "id",
      },
    },
    old_checkin_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    old_checkout_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    new_checkin_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    new_checkout_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "User",
        key: "id",
      },
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "BookingHistory",
    tableName: "BookingHistory",
    timestamps: true,
  }
);

export default BookingHistory;
