import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'

class TypeRoom extends Model {
  public id!: number;
  public name?: string;
  public description?: string;
}
TypeRoom.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,//Tự động tăng
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
    sequelize:sequelize,
    modelName:'TypeRoom',//Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: 'TypeRoom',//Tên được đặt trên database
    createdAt: false,
    timestamps:false, //Thời gian tạo
});

export default TypeRoom;
