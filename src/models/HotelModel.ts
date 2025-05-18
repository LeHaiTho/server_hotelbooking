import { DataTypes, DATE, Model } from "sequelize";
import sequelize from "../config/sequelize";
import RoomPrice from "./RoomPriceModel";
import Room from "./Room";

class Hotel extends Model {
  public id!: number;
  public id_user?: number;
  public name?: string;
  public description?: string;
  public address?: string;
  public policies?: string; //chính sách
  public arrAmenities?: string;
  public type?: string;
  public apartment?: string;
  public city?: string;
  public zipcode?: string;
  public address_no_diacritic?: string;
  public country?: string;
  public rate?: number;
  public checkinfrom?: string;
  public checkinto?: string;
  public checkoutfrom?: string;
  public checkoutto?: string;
  public ischildren?: boolean;
  public isAnimal?: boolean;
  public isRegister?: boolean;
  public images?: string;
  public latitude?: string;
  public longitude?: string;
}
Hotel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true, //Tự động tăng
      primaryKey: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address_no_diacritic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    policies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    arrAmenities: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apartment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zipcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    checkinfrom: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkinto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkoutfrom: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkoutto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ischildren: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    isAnimal: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isRegister: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    images: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    modelName: "Hotel", //Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: "Hotel", //Tên được đặt trên database
    timestamps: true, //Thời gian tạo
  }
);
export default Hotel;
