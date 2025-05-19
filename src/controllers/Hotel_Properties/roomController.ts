import { NextFunction, Request, Response } from "express";
import {
  BookingDetail,
  BookingHistory,
  BookingHotel,
  Hotel,
  Room,
  Room_Bed,
  Bed,
  Promotion,
  RoomPriceAdjustment,
} from "../../models/index";
import { Op, Sequelize } from "sequelize";
import sequelize from "../../config/sequelize";
import moment from "moment";

// //Tạo phòng mới
const create = async (req: Request, res: Response) => {
  const { idhotel } = req.params; // Lấy ID từ URL
  const payload = req.body;
  console.log(idhotel);
  console.log(payload);
  try {
    const { sophong } = payload;
    if (sophong) {
      // Tạo phòng theo số phòng
      for (let i = 1; i <= sophong; i++) {
        const roomValue = Object.fromEntries(
          Object.entries(payload).filter(
            ([key, value]) => !key.startsWith("giuong")
          )
        );
        const bedValue = Object.entries(payload).filter(([key, value]) =>
          key.startsWith("giuong")
        );

        //Lấy id khách sạn và tạo Phòng dựa trên id khách sạn
        const room = await Room.create({
          id_hotel: idhotel,
          ...roomValue,
          //Gán đè bằng 1
          sophong: 1,
        });

        //thêm bào bảng Room_Bed
        const idroom = room.id;
        if (bedValue.length > 0) {
          // for chờ async/await, forEach thì không
          for (const item of bedValue) {
            switch (item[0]) {
              case "giuongdon":
                await Room_Bed.create({
                  room_id: idroom,
                  bed_id: 1,
                  quantity: item[1],
                });
                break;
              case "giuongdoi":
                await Room_Bed.create({
                  room_id: idroom,
                  bed_id: 2,
                  quantity: item[1],
                });
                break;
              case "giuonglon":
                await Room_Bed.create({
                  room_id: idroom,
                  bed_id: 3,
                  quantity: item[1],
                });
                break;
              case "giuongcuclon":
                await Room_Bed.create({
                  room_id: idroom,
                  bed_id: 4,
                  quantity: item[1],
                });
                break;
              case "giuongtang":
                await Room_Bed.create({
                  room_id: idroom,
                  bed_id: 5,
                  quantity: item[1],
                });
                break;
              case "giuongsofa":
                await Room_Bed.create({
                  room_id: idroom,
                  bed_id: 6,
                  quantity: item[1],
                });
                break;
              case "giuongfuton":
                await Room_Bed.create({
                  room_id: idroom,
                  bed_id: 7,
                  quantity: item[1],
                });
                break;
            }
          }
        }
      }
      res.status(200).json("OK tạo thành công");
      return;
    }
    res.status(200).json({ message: "số phòng không đúng" });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
    return;
  }
};
// //Lấy phòng
// const get = async (req: Request, res: Response) => {
//   const { idhotel } = req.params; // Lấy ID từ URL
//   try {
//     const room = await Room.findAll({
//       where: { id_hotel: idhotel },
//       raw: true,
//     });
//     //Gọi hàm tính tổng trên cột quantity dựa vào room_id
//     const roombed = await Promise.all(
//       room.map(async (item: any) => {
//         const beds = await Room_Bed.findAll({
//           attributes: [
//             [Sequelize.fn("SUM", Sequelize.col("quantity")), "total_beds"],
//           ],
//           where: { room_id: item.id },
//           raw: true,
//         });
//         return { ...item, ...beds[0] };
//       })
//     );
//     res.status(200).json(roombed);
//     return;
//   } catch (err) {
//     res.status(500).json({ message: err });
//     return;
//   }
// };
// //lấy toàn bộ phòng mà không cần id khách sạn phục vụ cho cập nhật giá của phòng
// const getRooms = async (req: Request, res: Response) => {
//   try {
//     const rooms = await Room.findAll({ raw: true });
//     // Lọc danh sách chỉ lấy các typeroom duy nhất
//     const uniqueRooms = Array.from(
//       new Map(rooms.map((room) => [room?.loaichonghi, room])).values()
//     );
//     res.status(200).json(uniqueRooms);
//     return;
//   } catch (err) {
//     res.status(500).json({ message: err });
//     return;
//   }
// };
//Tạo phòng mới
// const create = async (req: Request, res: Response) => {
//   const { idhotel } = req.params; // Lấy ID từ URL
//   const payload = req.body;
//   try {
//     const { sophong } = payload;
//     if (sophong) {
//       // Tạo phòng theo số phòng
//       for (let i = 1; i <= sophong; i++) {
//         const roomValue = Object.fromEntries(
//           Object.entries(payload).filter(
//             ([key, value]) => !key.startsWith("giuong")
//           )
//         );
//         const bedValue = Object.entries(payload).filter(([key, value]) =>
//           key.startsWith("giuong")
//         );

//         //Lấy id khách sạn và tạo Phòng dựa trên id khách sạn
//         const room = await Room.create({
//           id_hotel: idhotel,
//           ...roomValue,
//           //Gán đè bằng 1
//           sophong: 1,
//         });

//         //thêm bào bảng Room_Bed
//         const idroom = room.id;
//         if (bedValue.length > 0) {
//           // for chờ async/await, forEach thì không
//           for (const item of bedValue) {
//             switch (item[0]) {
//               case "giuongdon":
//                 await Room_Bed.create({
//                   room_id: idroom,
//                   bed_id: 1,
//                   quantity: item[1],
//                 });
//                 break;
//               case "giuongdoi":
//                 await Room_Bed.create({
//                   room_id: idroom,
//                   bed_id: 2,
//                   quantity: item[1],
//                 });
//                 break;
//               case "giuonglon":
//                 await Room_Bed.create({
//                   room_id: idroom,
//                   bed_id: 3,
//                   quantity: item[1],
//                 });
//                 break;
//               case "giuongcuclon":
//                 await Room_Bed.create({
//                   room_id: idroom,
//                   bed_id: 4,
//                   quantity: item[1],
//                 });
//                 break;
//               case "giuongtang":
//                 await Room_Bed.create({
//                   room_id: idroom,
//                   bed_id: 5,
//                   quantity: item[1],
//                 });
//                 break;
//               case "giuongsofa":
//                 await Room_Bed.create({
//                   room_id: idroom,
//                   bed_id: 6,
//                   quantity: item[1],
//                 });
//                 break;
//               case "giuongfuton":
//                 await Room_Bed.create({
//                   room_id: idroom,
//                   bed_id: 7,
//                   quantity: item[1],
//                 });
//                 break;
//             }
//           }
//         }
//       }
//       res.status(200).json("OK tạo thành công");
//       return;
//     }
//     res.status(200).json({ message: "số phòng không đúng" });
//     return;
//   } catch (err) {
//     res.status(500).json({ message: err });
//     return;
//   }
// };
//Lấy phòng
const get = async (req: Request, res: Response) => {
  const { idhotel } = req.params; // Lấy ID từ URL
  try {
    const room = await Room.findAll({
      where: { id_hotel: idhotel },
      raw: true,
    });
    //Gọi hàm tính tổng trên cột quantity dựa vào room_id
    const roombed = await Promise.all(
      room.map(async (item: any) => {
        const beds = await Room_Bed.findAll({
          attributes: [
            [Sequelize.fn("SUM", Sequelize.col("quantity")), "total_beds"],
          ],
          where: { room_id: item.id },
          raw: true,
        });
        return { ...item, ...beds[0] };
      })
    );
    res.status(200).json(roombed);
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};
//lấy toàn bộ phòng dựa vào id khách sạn phục vụ cho cập nhật giá của phòng
const getRooms = async (req: Request, res: Response) => {
  const { idhotel } = req.params;
  try {
    const rooms = await Room.findAll({
      where: { id_hotel: idhotel },
      raw: true,
    });
    // Lọc danh sách chỉ lấy các typeroom duy nhất
    const uniqueRooms = Array.from(
      new Map(rooms.map((room) => [room?.loaichonghi, room])).values()
    );
    res.status(200).json(uniqueRooms);
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};

//Lấy phòng theo id phòng trong khách sạn
const getRoomsById = async (req: Request, res: Response) => {
  const { idroom } = req.params;
  try {
    const room = await Room.findOne({ where: { id: idroom }, raw: true });
    //lấy ra giường
    const beds = await Room_Bed.findAll({
      where: { room_id: idroom },
      raw: true,
    });
    const room_bed = await Promise.all(
      beds.map(async (item: any) => {
        const roomdetails = await Bed.findOne({
          where: { id: item.bed_id },
          raw: true,
        });
        return { ...roomdetails, ...item };
      })
    );
    const room_bed_object = room_bed.reduce((acc: any, item: any) => {
      acc[item.bed_id] = item; // Gán giá trị vào object
      return acc; // Trả về object đã cập nhật
    }, {});
    res.status(200).json({ room, beds: room_bed_object });
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};
//cập nhật phòng
const updateBed_Room = async (req: Request, res: Response) => {
  try {
    const { idroom } = req.params;
    const payload = req.body;
    const maBed: { [key: string]: number } = {
      giuongdon: 1,
      giuongdoi: 2,
      giuonglon: 3,
      giuongcuclon: 4,
      giuongtang: 5,
      giuongsofa: 6,
      giuongfuton: 7,
    };
    const roomValue = Object.fromEntries(
      Object.entries(payload).filter(
        ([key, value]) => !key.startsWith("giuong")
      )
    );
    const bedValue = Object.fromEntries(
      Object.entries(payload).filter(
        ([key, value]) => key.startsWith("giuong") && Number(value) > 0
      )
    );

    // Chuyển đổi key theo mã trong maBed
    const mabedValue = Object.fromEntries(
      Object.entries(bedValue).map(([key, value]) => [maBed[key] || key, value])
    );

    //Lấy giường thuộc phòng
    const bed_room = await Room_Bed.findAll({
      where: { room_id: idroom },
      raw: true,
    });
    //Lấy phòng theo id phòng
    const room = await Room.findOne({ where: { id: idroom } });
    //cập nhật thông tin phòng
    room?.update(roomValue);
    // cập nhật giường
    for (const bed of bed_room) {
      if (mabedValue[`${bed.bed_id}`]) {
        const bed_id = bed.bed_id;
        const quantity = mabedValue[`${bed_id}`];
        await Room_Bed.update(
          { quantity: quantity },
          { where: { room_id: idroom, bed_id: bed_id } }
        );
      }
    }
    // trả về kết quả
    res.status(200).json({ roomValue, bedValue, mabedValue });
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};
// ------------------------------------------------------------------MOBILE------------------------------------------------------------------
//Lấy phòng theo id khách sạn phía mobile
export {
  create,
  get,
  getRooms,
  getRoomByIdHotel,
  updateBed_Room,
  getRoomsById,
};
const getRoomByIdHotel = async (req: Request, res: Response) => {
  const { hotelId } = req.params;
  try {
    const groupedRooms = await Room.findAll({
      where: { id_hotel: hotelId },
      attributes: [
        [Sequelize.fn("MIN", Sequelize.col("id")), "id"],
        "loaichonghi",
        [Sequelize.fn("SUM", Sequelize.col("sophong")), "total_rooms"],
        [Sequelize.fn("MIN", Sequelize.col("sotien")), "sotien"],
      ],
      group: ["loaichonghi"],
    });

    res.status(200).json(groupedRooms);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

//Lấy tất cả phòng theo id khách sạn phía mobile (cách này này lấy có chọn lọc)
// export const getRoomByIdHotelMobile = async (req: Request, res: Response) => {
//   const { hotelId } = req.params;
//   const { checkInDate, checkOutDate, adults, children, rooms } = req.query;

//   const desiredRooms = Number(rooms);
//   const totalGuests = Number(adults);
//   const minPeoplePerRoom = Math.ceil(totalGuests / desiredRooms);

//   try {
//     const hotel = await Hotel.findByPk(hotelId, {
//       include: [
//         {
//           model: Room,
//           where: {
//             soluongkhach: {
//               [Op.gte]: minPeoplePerRoom,
//             },
//           },
//           attributes: [
//             "id",
//             "sotien",
//             "soluongkhach",
//             "loaichonghi",
//             "nameroom",
//           ],
//           include: [
//             {
//               model: BookingDetail,
//               as: "BookingDetails",
//               where: {
//                 [Op.or]: [
//                   {
//                     checkin_date: { [Op.between]: [checkInDate, checkOutDate] },
//                   },
//                   {
//                     checkout_date: {
//                       [Op.between]: [checkInDate, checkOutDate],
//                     },
//                   },
//                   {
//                     [Op.and]: [
//                       { checkin_date: { [Op.lte]: checkInDate } },
//                       { checkout_date: { [Op.gte]: checkOutDate } },
//                     ],
//                   },
//                 ],
//                 status: { [Op.ne]: "CANCELLED" },
//               },
//               required: false,
//             },
//           ],
//           required: true,
//         },
//       ],
//     });

//     if (!hotel) {
//       res.status(404).json({
//         message: "Không tìm thấy khách sạn",
//       });
//       return;
//     }

//     const plainHotel = hotel.get({ plain: true });
//     const availableRooms = plainHotel.Rooms.filter(
//       (room: any) => room.BookingDetails.length === 0
//     );

//     const roomNameType: any = {};
//     availableRooms.forEach((room: any) => {
//       const key = `${room.loaichonghi}-${room.nameroom}-${room.soluongkhach}`;
//       console.log(key);
//       if (!roomNameType[key]) {
//         roomNameType[key] = {
//           roomType: room.loaichonghi,
//           roomName: room.nameroom,
//           roomCapacity: room.soluongkhach,
//           roomPrice: room.sotien,
//           totalRoom: 0,
//           roomIds: [],
//         };
//       }
//       roomNameType[key].totalRoom++;
//       roomNameType[key].roomIds.push(room.id);
//     });
//     const roomNameTypeArray = Object.values(roomNameType).map((item: any) => ({
//       id: item.roomIds[0], // hoặc tạo uuid nếu muốn duy nhất
//       ...item,
//     }));

//     res.status(200).json(roomNameTypeArray);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: err });
//   }
// };

// Hàm calculateFinalPrice (giữ nguyên)
const calculateFinalPrice = (
  basePrice: number,
  adjustments: any[],
  promotions: any[],
  checkInDate: string,
  checkOutDate: string
): { initial_price: number; final_price: number } => {
  const checkIn = moment(checkInDate);
  const checkOut = moment(checkOutDate);

  const days = checkOut.diff(checkIn, "days");
  const initialPrice = basePrice * days;

  let totalPrice = 0;

  const daysOfWeek = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];

  for (let m = checkIn.clone(); m.isBefore(checkOut); m.add(1, "days")) {
    let dailyPrice = basePrice;
    const currentDay = m.day();

    const applicableAdjustments = adjustments
      .filter((adj) => {
        const start = adj.start_date ? moment(adj.start_date) : null;
        const end = adj.end_date ? moment(adj.end_date) : null;
        return (
          (start === null || m.isSameOrAfter(start)) &&
          (end === null || m.isSameOrBefore(end)) &&
          adj.apply_to_days.includes(currentDay)
        );
      })
      .sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));

    if (applicableAdjustments.length > 0) {
      const latestAdjustment = applicableAdjustments[0];
      if (latestAdjustment.adjustment_type === "PERCENTAGE") {
        dailyPrice *= 1 + Number(latestAdjustment.adjustment_value) / 100;
      } else if (latestAdjustment.adjustment_type === "FIXED") {
        dailyPrice += Number(latestAdjustment.adjustment_value);
      }
    } else {
      console.log(
        `Không áp dụng ngày thứ: ${daysOfWeek[currentDay]} (${m.format(
          "YYYY-MM-DD"
        )})`
      );
    }

    const applicablePromotions = promotions
      .filter((promo) => {
        const start = promo.start_date ? moment(promo.start_date) : null;
        const end = promo.end_date ? moment(promo.end_date) : null;
        return (
          promo.is_active &&
          (start === null || m.isSameOrAfter(start)) &&
          (end === null || m.isSameOrBefore(end))
        );
      })
      .sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));

    for (const promo of applicablePromotions) {
      if (promo.discount_type === "PERCENTAGE") {
        dailyPrice *= 1 - Number(promo.discount_value) / 100;
      } else if (promo.discount_type === "FIXED") {
        dailyPrice -= Number(promo.discount_value);
      }
    }

    totalPrice += Math.max(0, Math.round(dailyPrice));
  }

  return { initial_price: initialPrice, final_price: totalPrice };
};

export const getRoomByIdHotelMobile = async (req: any, res: any) => {
  const { hotelId } = req.params;
  const { checkInDate, checkOutDate, adults, children, rooms } = req.query;

  // Validate input
  if (!checkInDate || !checkOutDate || !adults || !rooms) {
    return res.status(400).json({
      message: "checkInDate, checkOutDate, adults, và rooms là bắt buộc",
    });
  }

  const desiredRooms = Number(rooms);
  const totalGuests = Number(adults);
  const minPeoplePerRoom = Math.ceil(totalGuests / desiredRooms);

  try {
    const hotel = await Hotel.findByPk(hotelId, {
      include: [
        {
          model: Room,
          where: {
            soluongkhach: {
              [Op.gte]: minPeoplePerRoom,
            },
          },
          attributes: [
            "id",
            "sotien",
            "soluongkhach",
            "loaichonghi",
            "nameroom",
          ],
          include: [
            {
              model: BookingDetail,
              as: "BookingDetails",
              where: {
                [Op.or]: [
                  {
                    checkin_date: { [Op.between]: [checkInDate, checkOutDate] },
                  },
                  {
                    checkout_date: {
                      [Op.between]: [checkInDate, checkOutDate],
                    },
                  },
                  {
                    [Op.and]: [
                      { checkin_date: { [Op.lte]: checkInDate } },
                      { checkout_date: { [Op.gte]: checkOutDate } },
                    ],
                  },
                ],
                status: { [Op.ne]: "CANCELLED" },
              },
              required: false,
            },
            {
              model: Promotion,
              as: "Promotions",
              attributes: [
                "name",
                "discount_type",
                "discount_value",
                "start_date",
                "end_date",
                "is_active",
              ],
              where: {
                is_active: true,
                [Op.or]: [
                  { start_date: null },
                  { start_date: { [Op.lte]: checkInDate } },
                ],
              },
              required: false,
            },
            {
              model: RoomPriceAdjustment,
              as: "RoomPriceAdjustments",
              attributes: [
                "reason",
                "adjustment_type",
                "adjustment_value",
                "apply_to_days",
                "start_date",
                "end_date",
              ],
              where: {
                [Op.or]: [
                  { start_date: null },
                  { start_date: { [Op.lte]: checkInDate } },
                ],
              },
              required: false,
            },
          ],
          required: true,
        },
      ],
    });

    if (!hotel) {
      return res.status(404).json({
        message: "Không tìm thấy khách sạn",
      });
    }

    const plainHotel = hotel.get({ plain: true });

    // Lọc phòng trống và tính giá
    const availableRooms = plainHotel.Rooms.filter(
      (room: any) => room.BookingDetails.length === 0
    ).map((room: any) => {
      const { initial_price, final_price } = calculateFinalPrice(
        room.sotien,
        room.RoomPriceAdjustments,
        room.Promotions,
        checkInDate as string,
        checkOutDate as string
      );
      return {
        ...room,
        initial_price,
        final_price,
      };
    });

    // Nhóm phòng theo loaichonghi, nameroom, soluongkhach
    const roomNameType: any = {};
    availableRooms.forEach((room: any) => {
      const key = `${room.loaichonghi}-${room.nameroom}-${room.soluongkhach}`;
      if (!roomNameType[key]) {
        roomNameType[key] = {
          id: room.id,
          roomType: room.loaichonghi,
          roomName: room.nameroom,
          roomCapacity: room.soluongkhach,
          roomPrice: room.sotien,
          initial_price: room.initial_price,
          final_price: room.final_price,
          promotions: room.Promotions, // Dữ liệu khuyến mãi ngắn gọn
          adjustments: room.RoomPriceAdjustments, // Dữ liệu điều chỉnh ngắn gọn
          totalRoom: 0,
          roomIds: [],
        };
      }
      roomNameType[key].totalRoom++;
      roomNameType[key].roomIds.push(room.id);
    });

    const roomNameTypeArray = Object.values(roomNameType);

    res.status(200).json(roomNameTypeArray);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách phòng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// export const checkRoomForUpdate = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   const { bookingId, newCheckInDate, newCheckOutDate } = req.body;

//   // 1. Kiểm tra đầu vào
//   if (!bookingId || !newCheckInDate || !newCheckOutDate) {
//     res.status(400).json({
//       message:
//         "Thiếu các trường bắt buộc: bookingId, newCheckInDate, newCheckOutDate",
//     });
//     return;
//   }

//   try {
//     // 2. Lấy thông tin chi tiết booking để tìm id_room
//     const bookingDetail = await BookingDetail.findAll({
//       where: {
//         id_booking_hotel: bookingId,
//       },
//     });

//     if (!bookingDetail) {
//       res.status(404).json({
//         message: "Không tìm thấy thông tin booking",
//       });
//       return;
//     }

//     const roomId = bookingDetail.map((item: any) => item.id_room);
//     console.log(roomId);
//     // 3. Kiểm tra booking trùng lặp cho phòng trong khoảng thời gian mới
//     const overlappingBookings = await BookingDetail.findAll({
//       where: {
//         id_room: roomId,
//         id_booking_hotel: { [Op.ne]: bookingId }, // Loại trừ booking hiện tại
//         status: { [Op.ne]: "CANCELLED" }, // Loại bỏ booking đã hủy
//         [Op.or]: [
//           {
//             checkin_date: { [Op.between]: [newCheckInDate, newCheckOutDate] },
//           },
//           {
//             checkout_date: { [Op.between]: [newCheckInDate, newCheckOutDate] },
//           },
//           {
//             [Op.and]: [
//               { checkin_date: { [Op.lte]: newCheckInDate } },
//               { checkout_date: { [Op.gte]: newCheckOutDate } },
//             ],
//           },
//         ],
//       },
//     });

//     // 4. Trả về kết quả
//     if (overlappingBookings.length > 0) {
//       res.status(400).json({
//         available: false,
//         message: "Phòng không trống cho khoảng thời gian mới",
//       });
//       return;
//     }

//     res.status(200).json({
//       available: true,
//       message: "Phòng trống cho khoảng thời gian mới",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Lỗi server",
//     });
//   }
// };

export const checkRoomForUpdate = async (
  req: any,
  res: any,
  next: any
): Promise<void> => {
  const { bookingId, newCheckInDate, newCheckOutDate } = req.body;

  // 1. Kiểm tra đầu vào
  if (!bookingId || !newCheckInDate || !newCheckOutDate) {
    res.status(400).json({
      message:
        "Thiếu các trường bắt buộc: bookingId, newCheckInDate, newCheckOutDate",
    });
    return;
  }

  try {
    // 2. Lấy thông tin booking và khách sạn
    const bookingHotel = await BookingHotel.findOne({
      where: {
        id: bookingId,
      },
    });

    if (!bookingHotel) {
      res.status(404).json({
        message: "Không tìm thấy thông tin booking",
      });
      return;
    }

    const hotelId = bookingHotel.id_hotel;

    // 3. Lấy thông tin chi tiết booking và loại chỗ nghỉ
    const bookingDetails = await BookingDetail.findAll({
      where: {
        id_booking_hotel: bookingId,
      },
      include: [
        {
          model: Room,
          attributes: ["loaichonghi"],
        },
      ],
    });

    if (bookingDetails.length === 0) {
      res.status(404).json({
        message: "Không tìm thấy chi tiết booking",
      });
      return;
    }

    // 4. Tính tổng số phòng cần theo loại chỗ nghỉ
    const roomTypeRequirements: { [key: string]: number } = {};
    bookingDetails.forEach((detail: any) => {
      const loaichonghi = detail.Room.loaichonghi;
      const quantity = detail.quantity || 1; // Mặc định quantity là 1 nếu không có
      roomTypeRequirements[loaichonghi] =
        (roomTypeRequirements[loaichonghi] || 0) + quantity;
    });

    // 5. Tìm các phòng trống theo loại chỗ nghỉ trong cùng khách sạn
    const availableRoomsByType: { [key: string]: any[] } = {};
    for (const loaichonghi of Object.keys(roomTypeRequirements)) {
      const requiredQuantity = roomTypeRequirements[loaichonghi];

      // Lấy tất cả các phòng của khách sạn có loaichonghi phù hợp
      const rooms = await Room.findAll({
        where: {
          id_hotel: hotelId,
          loaichonghi,
          is_available: true, // Chỉ lấy các phòng đang khả dụng
        },
        attributes: ["id", "nameroom", "sotien", "soluongkhach", "loaichonghi"],
      });

      // Kiểm tra xem các phòng này có bị đặt trong khoảng thời gian mới không
      const roomIds = rooms.map((room) => room.id);
      const overlappingBookings = await BookingDetail.findAll({
        where: {
          id_room: roomIds,
          // id_booking_hotel: { [Op.ne]: bookingId }, // Loại trừ booking hiện tại
          status: { [Op.ne]: "CANCELLED" }, // Loại bỏ booking đã hủy
          [Op.or]: [
            {
              checkin_date: { [Op.between]: [newCheckInDate, newCheckOutDate] },
            },
            {
              checkout_date: {
                [Op.between]: [newCheckInDate, newCheckOutDate],
              },
            },
            {
              [Op.and]: [
                { checkin_date: { [Op.lte]: newCheckInDate } },
                { checkout_date: { [Op.gte]: newCheckOutDate } },
              ],
            },
          ],
        },
      });

      // Lọc các phòng trống
      const bookedRoomIds = overlappingBookings.map(
        (booking: any) => booking.id_room
      );
      const availableRooms = rooms.filter(
        (room) => !bookedRoomIds.includes(room.id)
      );

      // Kiểm tra xem có đủ số lượng phòng trống không
      if (availableRooms.length < requiredQuantity) {
        res.status(400).json({
          available: false,
          message: `Không đủ phòng trống cho loại chỗ nghỉ ${loaichonghi} tại khách sạn`,
        });
        return;
      }

      // Lưu danh sách phòng trống theo loại chỗ nghỉ
      availableRoomsByType[loaichonghi] = availableRooms.slice(
        0,
        requiredQuantity
      ); // Chỉ lấy số lượng phòng cần thiết
    }

    // 6. Trả về kết quả
    res.status(200).json({
      available: true,
      message: "Có đủ phòng trống cho khoảng thời gian mới tại khách sạn",
      data: availableRoomsByType, // Danh sách phòng trống theo loại chỗ nghỉ
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// Thay đổi thời gian đặt phòng

// export const updateBookingSchedule = async (req: Request, res: Response) => {
//   const { bookingId, newCheckInDate, newCheckOutDate } = req.body;
//   const { userId } = req.body.user.id;
//   const transaction = await sequelize.transaction();
//   try {
//     const bookingHotel = await BookingHotel.findOne({
//       where: {
//         id: bookingId,
//       },
//       transaction,
//     });

//     const bookingDetail = await BookingDetail.findOne({
//       where: {
//         id_booking_hotel: bookingId,
//       },
//       transaction,
//     });

//     if (!bookingHotel || !bookingDetail) {
//       res.status(404).json({
//         message: "Không tìm thấy thông tin booking",
//       });
//       return;
//     }
//     const oldCheckInDate = bookingHotel.checkin_date;
//     const oldCheckOutDate = bookingHotel.checkout_date;

//     // Kiểm tra xem thời gian mới có trùng với thời gian đã đặt không
//     if (
//       oldCheckInDate === newCheckInDate &&
//       oldCheckOutDate === newCheckOutDate
//     ) {
//       res.status(400).json({
//         message: "Thời gian đặt phòng không thể giống với thời gian đã đặt",
//       });
//       return;
//     }

//     await bookingHotel.update({
//       checkin_date: newCheckInDate,
//       checkout_date: newCheckOutDate,
//       updatedAt: new Date(),
//       where: {
//         id: bookingId,
//       },
//       transaction,
//     });

//     await bookingDetail.update({
//       checkin_date: newCheckInDate,
//       checkout_date: newCheckOutDate,
//       updatedAt: new Date(),
//       where: {
//         id_booking_hotel: bookingId,
//       },
//       transaction,
//     });

//     await BookingHistory.create(
//       {
//         id_booking_hotel: bookingId,
//         id_booking_detail: bookingDetail.id,
//         old_checkin_date: oldCheckInDate,
//         old_checkout_date: oldCheckOutDate,
//         new_checkin_date: newCheckInDate,
//         new_checkout_date: newCheckOutDate,
//         changed_by: bookingHotel.id_user,
//         reason: "Cập nhật thời gian đặt phòng",
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     res.status(200).json({
//       message: "Thời gian đặt phòng đã được cập nhật",
//     });
//   } catch (error) {
//     console.log(error);
//     await transaction.rollback();
//     res.status(500).json({
//       message: "Lỗi server",
//     });
//   }
// };

export const checkAndUpdateBookingSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { bookingId, newCheckInDate, newCheckOutDate } = req.body;

  // 1. Kiểm tra đầu vào
  if (!bookingId || !newCheckInDate || !newCheckOutDate) {
    res.status(400).json({
      message:
        "Thiếu các trường bắt buộc: bookingId, newCheckInDate, newCheckOutDate",
    });
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    // 2. Lấy thông tin booking và khách sạn
    const bookingHotel = await BookingHotel.findOne({
      where: { id: bookingId },
      transaction,
    });

    if (!bookingHotel) {
      await transaction.rollback();
      res.status(404).json({
        message: "Không tìm thấy thông tin booking",
      });
      return;
    }

    const hotelId = bookingHotel.id_hotel;
    const oldCheckInDate = bookingHotel.checkin_date;
    const oldCheckOutDate = bookingHotel.checkout_date;

    // Kiểm tra xem thời gian mới có trùng với thời gian cũ không
    if (
      oldCheckInDate === newCheckInDate &&
      oldCheckOutDate === newCheckOutDate
    ) {
      await transaction.rollback();
      res.status(400).json({
        message: "Thời gian đặt phòng mới không thể giống với thời gian đã đặt",
      });
      return;
    }

    // 3. Lấy thông tin chi tiết booking
    const bookingDetails = await BookingDetail.findAll({
      where: { id_booking_hotel: bookingId },
      transaction,
    });

    if (bookingDetails.length === 0) {
      await transaction.rollback();
      res.status(404).json({
        message: "Không tìm thấy chi tiết booking",
      });
      return;
    }

    // 4. Lấy loaichonghi từ Room dựa trên id_room
    const roomTypeRequirements: { [key: string]: number } = {};
    for (const detail of bookingDetails) {
      const room = await Room.findOne({
        where: { id: detail.id_room },
        attributes: ["loaichonghi"],
        transaction,
      });

      if (!room) {
        await transaction.rollback();
        res.status(404).json({
          message: `Không tìm thấy phòng với id_room ${detail.id_room}`,
        });
        return;
      }

      const loaichonghi = room.loaichonghi || "";
      const quantity = detail.quantity || 1;
      roomTypeRequirements[loaichonghi] =
        (roomTypeRequirements[loaichonghi] || 0) + quantity;
    }

    // 5. Tìm và gán các phòng trống theo loại chỗ nghỉ trong cùng khách sạn
    const assignedRoomsByType: { [key: string]: any[] } = {};
    for (const loaichonghi of Object.keys(roomTypeRequirements)) {
      const requiredQuantity = roomTypeRequirements[loaichonghi];

      // Lấy tất cả các phòng của khách sạn có loaichonghi phù hợp
      const rooms = await Room.findAll({
        where: {
          id_hotel: hotelId,
          loaichonghi,
          is_available: true,
        },
        attributes: ["id", "nameroom", "sotien", "soluongkhach", "loaichonghi"],
        transaction,
      });

      // Kiểm tra xem các phòng này có bị đặt trong khoảng thời gian mới không
      const roomIds = rooms.map((room) => room.id);
      const overlappingBookings = await BookingDetail.findAll({
        where: {
          id_room: roomIds,
          id_booking_hotel: { [Op.ne]: bookingId }, // Loại trừ booking hiện tại
          status: { [Op.ne]: "CANCELLED" },
          [Op.or]: [
            {
              checkin_date: { [Op.between]: [newCheckInDate, newCheckOutDate] },
            },
            {
              checkout_date: {
                [Op.between]: [newCheckInDate, newCheckOutDate],
              },
            },
            {
              [Op.and]: [
                { checkin_date: { [Op.lte]: newCheckInDate } },
                { checkout_date: { [Op.gte]: newCheckOutDate } },
              ],
            },
          ],
        },
        transaction,
      });

      // Lọc các phòng trống
      const bookedRoomIds = overlappingBookings.map(
        (booking: any) => booking.id_room
      );
      const availableRooms = rooms.filter(
        (room) => !bookedRoomIds.includes(room.id)
      );

      // Kiểm tra xem có đủ số lượng phòng trống không
      if (availableRooms.length < requiredQuantity) {
        await transaction.rollback();
        res.status(400).json({
          available: false,
          message: `Không đủ phòng trống cho loại chỗ nghỉ ${loaichonghi} tại khách sạn`,
        });
        return;
      }

      // Gán các phòng trống (lấy đúng số lượng cần)
      assignedRoomsByType[loaichonghi] = availableRooms.slice(
        0,
        requiredQuantity
      );
    }

    // 6. Lưu lịch sử thay đổi vào BookingHistory
    for (const detail of bookingDetails) {
      await BookingHistory.create(
        {
          id_booking_hotel: bookingId,
          id_booking_detail: detail.id,
          old_checkin_date: detail.checkin_date,
          old_checkout_date: detail.checkout_date,
          new_checkin_date: newCheckInDate,
          new_checkout_date: newCheckOutDate,
          changed_by: bookingHotel.id_user,
          reason: "Cập nhật thời gian và phòng đặt phòng",
        },
        { transaction }
      );
    }

    // 7. Cập nhật BookingHotel
    await BookingHotel.update(
      {
        checkin_date: newCheckInDate,
        checkout_date: newCheckOutDate,
        updatedAt: new Date(),
      },
      {
        where: { id: bookingId },
        transaction,
      }
    );

    // 8. Cập nhật BookingDetail với các phòng mới
    for (const detail of bookingDetails) {
      const room = await Room.findOne({
        where: { id: detail.id_room },
        attributes: ["loaichonghi"],
        transaction,
      });

      if (!room) {
        await transaction.rollback();
        res.status(404).json({
          message: `Không tìm thấy phòng với id_room ${detail.id_room}`,
        });
        return;
      }

      const loaichonghi = room.loaichonghi || "";
      const quantity = detail.quantity || 1;
      const assignedRooms = assignedRoomsByType[loaichonghi]?.slice(
        0,
        quantity
      );

      if (assignedRooms.length < quantity) {
        await transaction.rollback();
        res.status(400).json({
          message: `Không đủ phòng cho loại chỗ nghỉ ${loaichonghi}`,
        });
        return;
      }

      // Cập nhật id_room cho BookingDetail
      for (let i = 0; i < quantity; i++) {
        await BookingDetail.update(
          {
            id_room: assignedRooms[i].id,
            checkin_date: newCheckInDate,
            checkout_date: newCheckOutDate,
            updatedAt: new Date(),
          },
          {
            where: { id: detail.id },
            transaction,
          }
        );
      }
    }

    // 9. Commit transaction
    await transaction.commit();

    // 10. Trả về kết quả
    res.status(200).json({
      available: true,
      message: "Lịch đặt phòng và phòng đã được cập nhật thành công",
      data: {
        bookingId,
        newCheckInDate,
        newCheckOutDate,
        assignedRooms: assignedRoomsByType,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({
      message: "Lỗi server",
    });
  }
};
