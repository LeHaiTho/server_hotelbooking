import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'

class Bed extends Model {
  public id!: number;
  public name?: string;
  public size?: string;
}
Bed.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,//Tự động tăng
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
    sequelize:sequelize,
    modelName:'Bed',//Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: 'Bed',//Tên được đặt trên database
    createdAt: false,
    timestamps:false, //Thời gian tạo
});

export default Bed;
