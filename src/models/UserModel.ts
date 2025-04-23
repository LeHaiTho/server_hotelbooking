import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'

class User extends Model {
  public id!: number;
  public firstname?: string;
  public lastname?: string;
  public phonenumber?: string;
  public email?: string;
  public password?: string;
  public provider?: string;//Kiểu đăng nhập google, fabook
  public provider_id?: string; //id
  public image_url?: string;
  public country_code?: string;
  public email_verified?: boolean; // email xác nhận
}
User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,//Tự động tăng
    primaryKey: true,
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: true,//cho phép giá trị có thể null
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phonenumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  provider_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  image_url: {
      type: DataTypes.STRING,
      allowNull: true
  },
  country_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, //Mặc định là false khi tạo mới user
    allowNull: true,  
  }
}, {
    sequelize:sequelize,
    modelName:'User',//Tên model này sẽ ánh xạ đến bảng dữ liệu trên database
    tableName: 'User',//Tên được đặt trên database
    timestamps:true, //Thời gian tạo
});

export default User;
