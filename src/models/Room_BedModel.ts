import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'

class Room_Bed extends Model {
  public id!: number;
  public room_id?: number;
  public bed_id?: number;
  public quantity?: number;
}
Room_Bed.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,//Tự động tăng
    primaryKey: true,
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bed_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
    sequelize:sequelize,
    modelName:'Room_Bed',//Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: 'Room_Bed',//Tên được đặt trên database
    createdAt: false,
    timestamps:false, //Thời gian tạo
});

export default Room_Bed;
