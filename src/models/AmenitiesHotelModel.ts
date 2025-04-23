import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'

class Amenities_Hotel extends Model {
  public id!: number;
  public name?: string;
}
Amenities_Hotel.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,//Tự động tăng
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
    sequelize:sequelize,
    modelName:'Amenities_Hotel',//Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: 'Amenities_Hotel',//Tên được đặt trên database
    createdAt: false,
    timestamps:false, //Thời gian tạo
});

export default Amenities_Hotel;
