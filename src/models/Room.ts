import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import Hotel from "./HotelModel";
import RoomPrice from "./RoomPriceModel";

class Room extends Model {
  public id!: number;
  public id_hotel?: number;
  public dientichphong?: number;
  public donvido?: string;
  public issmoking?: boolean;
  public loaichonghi?: string;
  public soluongkhach?: number;
  public sophong?: number;
  public phongtamrieng?: boolean;
  public vatdungbathroom?: string;
  public doandichvu?: string;
  public khonggian?: string;
  public tiennghichung?: string;
  public nameroom?: string;
  public sotien?: number;
  public is_available?: boolean;
}
Room.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true, //Tự động tăng
      primaryKey: true,
    },
    id_hotel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Hotel,
        key: "id",
      },
    },
    dientichphong: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    donvido: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    issmoking: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    loaichonghi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    soluongkhach: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sophong: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    phongtamrieng: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    vatdungbathroom: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    doandichvu: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    khonggian: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tiennghichung: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nameroom: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sotien: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, //Mặc đ��nh s�� có giá trị mặc đ��nh là true
      allowNull: true, //Không cho phép NULL
    },
  },
  {
    sequelize: sequelize,
    modelName: "Room", //Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: "Room", //Tên được đặt trên database
    timestamps: true, //Thời gian tạo
  }
);

export default Room;
