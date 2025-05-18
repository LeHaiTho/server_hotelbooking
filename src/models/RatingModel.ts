import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import User from "./UserModel";
import Hotel from "./HotelModel";
import Room from "./Room";
import BookingHotel from "./BookingHotel";

class Rating extends Model {
  public id!: number;
  public user_id?: number;
  public hotel_id?: number;
  public room_id?: number;
  public booking_hotel_id?: number;
  public overall?: number;
  public staff?: number;
  public facility?: number;
  public comfortable?: number;
  public clean?: number;
  public money?: number;
  public location?: number;
  public comment?: string;
  public stay_date?: Date;
  public isDeleted?: boolean;
}

export default Rating.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Hotel,
        key: "id",
      },
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Room,
        key: "id",
      },
    },
    booking_hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: BookingHotel,
        key: "id",
      },
    },
    overall: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10, // Thang điểm 1-10 cho overall
      },
    },
    staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4, // Thang điểm 1-4
      },
    },
    facility: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    comfortable: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    clean: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    money: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    location: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000], // Tối đa 1000 ký tự
      },
    },
    stay_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: "Rating",
    tableName: "Ratings",
    timestamps: true,
  }
);
