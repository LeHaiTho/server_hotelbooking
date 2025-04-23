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

Hotel.belongsTo(User, { foreignKey: "id_user" });
User.hasMany(Hotel, { foreignKey: "id_user" });

BookingDetail.hasMany(BookingHistory, { foreignKey: "id_booking_detail" });
BookingHistory.belongsTo(BookingDetail, { foreignKey: "id_booking_detail" });

BookingHotel.hasMany(BookingHistory, { foreignKey: "id_booking_hotel" });
BookingHistory.belongsTo(BookingHotel, { foreignKey: "id_booking_hotel" });

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
};
