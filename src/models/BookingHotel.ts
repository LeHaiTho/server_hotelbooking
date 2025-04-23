import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import User from "./UserModel";
import Hotel from "./HotelModel";

class BookingHotel extends Model {
  public id!: number;
  public id_user!: number;
  public id_hotel!: number;
  public checkin_date!: Date;
  public checkout_date!: Date;
  public total_price!: number;
  public total_adult?: number;
  public total_children?: number;
  public total_quantity?: number;
  public status!: string;
  public phone!: string;
  public payment_method!: string;
}
BookingHotel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    id_hotel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Hotel,
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
    total_price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    total_adult: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_children: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED"),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM("CASH", "CREDIT_CARD"),
      allowNull: false,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: "BookingHotel",
    tableName: "BookingHotel",
    timestamps: true,
  }
);

export default BookingHotel;
