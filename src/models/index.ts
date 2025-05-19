import sequelize from "../config/sequelize";
import User from "./UserModel";
import Role from "./RoleModel";
import Hotel from "./HotelModel";
import Amenities_Hotel from "./AmenitiesHotelModel";
import Type_Hotel from "./TypeHotelModel";
import TypeRoom from "./TypeRoomModel";
import Bed from "./Bed";
import Room_Bed from "./Room_BedModel";
import Room from "./Room";
import RoomPrice from "./RoomPriceModel";
import BookingHotel from "./BookingHotel";
import BookingDetail from "./BookingDetail";
import BookingHistory from "./BookingHistoryModel";
import Province from "./ProvincesModel";
import City from "./CitiesModel";
import RoomPriceAdjustment from "./RoomPriceAdjustment";
import Promotion from "./PromotionModel";
import BookingDetailPromotion from "./BookingDetailPromotionModel";
import Rating from "./RatingModel";

Rating.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Rating, { foreignKey: "user_id" });

Rating.belongsTo(Hotel, { foreignKey: "hotel_id" });
Hotel.hasMany(Rating, { foreignKey: "hotel_id" });

Rating.belongsTo(Room, { foreignKey: "room_id" });
Room.hasMany(Rating, { foreignKey: "room_id" });

Rating.belongsTo(BookingHotel, { foreignKey: "booking_hotel_id" });
BookingHotel.hasMany(Rating, { foreignKey: "booking_hotel_id" });

Hotel.hasMany(Room, { foreignKey: "id_hotel" });
Room.belongsTo(Hotel, { foreignKey: "id_hotel" });

Room.hasMany(RoomPrice, { foreignKey: "room_id" });
RoomPrice.belongsTo(Room, { foreignKey: "room_id" });

BookingHotel.belongsTo(User, { foreignKey: "id_user" });
BookingHotel.belongsTo(Hotel, { foreignKey: "id_hotel" });
BookingHotel.hasMany(BookingDetail, { foreignKey: "id_booking_hotel" });
BookingDetail.belongsTo(BookingHotel, { foreignKey: "id_booking_hotel" });

Room.hasMany(BookingDetail, { foreignKey: "id_room" });
BookingDetail.belongsTo(Room, { foreignKey: "id_room" });

User.hasMany(BookingHotel, { foreignKey: "id_user" });
Hotel.hasMany(BookingHotel, { foreignKey: "id_hotel" });

// Hotel.belongsTo(User, { foreignKey: "id_user", as: "owner" });
Hotel.belongsTo(User, { foreignKey: "id_user" });
User.hasMany(Hotel, { foreignKey: "id_user" });

BookingDetail.hasMany(BookingHistory, { foreignKey: "id_booking_detail" });
BookingHistory.belongsTo(BookingDetail, { foreignKey: "id_booking_detail" });

BookingHotel.hasMany(BookingHistory, { foreignKey: "id_booking_hotel" });
BookingHistory.belongsTo(BookingHotel, { foreignKey: "id_booking_hotel" });

Province.hasMany(City, { foreignKey: "province_id" });
City.belongsTo(Province, { foreignKey: "province_id" });

RoomPriceAdjustment.belongsTo(Room, { foreignKey: "id_room" });
Room.hasMany(RoomPriceAdjustment, { foreignKey: "id_room" });

Promotion.hasMany(BookingDetailPromotion, { foreignKey: "id_promotion" });
BookingDetailPromotion.belongsTo(Promotion, { foreignKey: "id_promotion" });

Promotion.belongsTo(Room, { foreignKey: "id_room" });
Room.hasMany(Promotion, { foreignKey: "id_room" });

BookingDetail.hasMany(BookingDetailPromotion, {
  foreignKey: "id_booking_detail",
});
BookingDetailPromotion.belongsTo(BookingDetail, {
  foreignKey: "id_booking_detail",
});

// Room.belongsTo(TypeRoom, { foreignKey: "id_type_room" });
// TypeRoom.hasMany(Room, { foreignKey: "id_type_room" });

export {
  User,
  Role,
  Hotel,
  Type_Hotel,
  Amenities_Hotel,
  TypeRoom,
  Bed,
  Room_Bed,
  Room,
  RoomPrice,
  BookingHotel,
  BookingDetail,
  BookingHistory,
  Province,
  City,
  RoomPriceAdjustment,
  Promotion,
  BookingDetailPromotion,
  Rating,
};
