import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'

class Role extends Model {
  public id!: number;
  public id_user?: number;
  public role_name?: string;
}
Role.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,//Tự động tăng
    primaryKey: true,
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  role_name: {
     type: DataTypes.STRING,
     allowNull: false,
  }
}, {
    sequelize:sequelize,
    modelName:'Role',//Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: 'Role',//Tên được đặt trên database
    timestamps:true, //Thời gian tạo
});

export default Role;
