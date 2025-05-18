import { Model, DataTypes } from "sequelize";
import sequelize from "../config/sequelize";
import BookingDetail from "./BookingDetail";
import Promotion from "./PromotionModel";

class BookingDetailPromotion extends Model {
  public id!: number;
  public id_booking_detail!: number;
  public id_promotion!: number;
  public discount_applied!: number;
}
BookingDetailPromotion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_booking_detail: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BookingDetail,
        key: "id",
      },
    },
    id_promotion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Promotion,
        key: "id",
      },
    },
    discount_applied: {
      type: DataTypes.DECIMAL,
      allowNull: false, // Giá trị giảm giá thực tế từ khuyến mãi này
    },
  },
  {
    sequelize,
    modelName: "BookingDetailPromotion",
    tableName: "BookingDetailPromotion",
    timestamps: true,
  }
);

export default BookingDetailPromotion;
