import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'

class Type_Hotel extends Model {
  public id!: number;
  public name?: string;
  public description?: string;
}
Type_Hotel.init({
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
    modelName:'Type_Hotel',//Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: 'Type_Hotel',//Tên được đặt trên database
    createdAt: false,
    timestamps:false, //Thời gian tạo
});

export default Type_Hotel;
