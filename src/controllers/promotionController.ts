import moment from "moment";
import sequelize from "../config/sequelize";
import { Promotion, Room } from "../models";

export const createPromotion = async (req: any, res: any) => {
  const {
    name,
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    minStay,
    bookingDaysInAdvance,
    isActive,
  } = req.body;

  // Kiểm tra discountType
  if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
    return res.status(400).json({ message: "Loại giảm giá không hợp lệ" });
  }

  try {
    const promotion = await sequelize.transaction(async (t) => {
      return await Promotion.create(
        {
          id_hotel: null, // Khuyến mãi hệ thống
          name,
          description,
          discount_type: discountType,
          discount_value: discountValue,
          start_date: startDate,
          end_date: endDate,
          min_stay: minStay || null,
          booking_days_in_advance: bookingDaysInAdvance || null,
          is_active: isActive !== undefined ? isActive : true,
        },
        { transaction: t }
      );
    });

    res.status(200).json({
      message: "Tạo khuyến mãi thành công",
      promotion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
export const getPromotions = async (req: any, res: any) => {
  const { systemOnly } = req.query;

  try {
    const where: any = {};
    if (systemOnly === "true") {
      where.id_hotel = null; // Chỉ lấy khuyến mãi hệ thống
    }

    const promotions = await Promotion.findAll({
      where,
      attributes: [
        "id",
        "id_hotel",
        "name",
        "description",
        "discount_type",
        "discount_value",
        "start_date",
        "end_date",
        "min_stay",
        "booking_days_in_advance",
        "is_active",
        "createdAt",
        "updatedAt",
      ],
    });

    res.status(200).json({ promotions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
// Áp dụng khuyến mãi hệ thống
export const applyPromotion = async (req: any, res: any) => {
  const {
    id_hotel,
    ids_room,
    name,
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    minStay,
    bookingDaysInAdvance,
    isActive,
  } = req.body;

  // Kiểm tra đầu vào
  // if (
  //   !id_hotel ||
  //   !ids_room ||
  //   !Array.isArray(ids_room) ||
  //   ids_room.length === 0
  // ) {
  //   return res.status(400).json({
  //     message: "Thiếu trường bắt buộc: promotionId, id_hotel, ids_room",
  //   });
  // }
  console.log(req.body);
  try {
    // Kiểm tra khuyến mãi hệ thống
    // const systemPromotion = await Promotion.findOne({
    //   where: { id: promotionId, id_hotel: null },
    // });
    // if (!systemPromotion) {
    //   return res.status(404).json({
    //     message: "Khuyến mãi không tồn tại hoặc không phải khuyến mãi hệ thống",
    //   });
    // }

    // Kiểm tra phòng thuộc khách sạn
    const rooms = await Room.findAll({ where: { id: ids_room, id_hotel } });
    if (rooms.length !== ids_room.length) {
      return res
        .status(400)
        .json({ message: "Một số phòng không thuộc khách sạn này" });
    }

    // Kiểm tra ngày hợp lệ
    // if (startDate && endDate) {
    //   if (
    //     !moment(startDate).isValid() ||
    //     !moment(endDate).isValid() ||
    //     moment(startDate).isAfter(endDate)
    //   ) {
    //     return res.status(400).json({ message: "Ngày không hợp lệ" });
    //   }
    //   // Kiểm tra thời gian nằm trong khoảng khuyến mãi hệ thống
    //   if (
    //     moment(startDate).isBefore(systemPromotion.start_date) ||
    //     moment(endDate).isAfter(systemPromotion.end_date)
    //   ) {
    //     return res.status(400).json({
    //       message:
    //         "Thời gian áp dụng phải nằm trong khoảng thời gian của khuyến mãi hệ thống",
    //     });
    //   }
    // }

    // Kiểm tra discountType
    if (discountType && !["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res.status(400).json({ message: "Loại giảm giá không hợp lệ" });
    }

    // Tạo các bản ghi Promotion mới
    const promotions = await sequelize.transaction(async (t) => {
      const createdPromotions = [];
      for (const roomId of ids_room) {
        const promotion = await Promotion.create(
          {
            id_hotel,
            id_room: roomId,
            name: name,
            description: description,
            discount_type: discountType,
            discount_value: discountValue,
            start_date: startDate,
            end_date: endDate,
            min_stay: minStay !== undefined ? minStay : null,
            booking_days_in_advance:
              bookingDaysInAdvance !== undefined ? bookingDaysInAdvance : null,
            is_active: isActive !== undefined ? isActive : true,
          },
          { transaction: t }
        );
        createdPromotions.push(promotion);
      }
      return createdPromotions;
    });

    res.status(201).json({
      message: "Áp dụng khuyến mãi thành công",
      promotions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách khuyến mãi của khách sạn, gộp theo tên
export const getHotelPromotions = async (req: any, res: any) => {
  const { hotel_id } = req.params;

  if (!hotel_id || isNaN(Number(hotel_id))) {
    return res.status(400).json({ message: "hotel_id không hợp lệ" });
  }

  try {
    // Lấy danh sách khuyến mãi
    const promotions = await Promotion.findAll({
      where: {
        id_hotel: hotel_id,
        is_active: true,
      },
      include: [
        {
          model: Room,
          attributes: ["id", "loaichonghi", "sotien"],
          required: false, // Cho phép id_room = NULL
        },
      ],
      order: [["updatedAt", "DESC"]], // Bản ghi mới nhất lên đầu
    });

    // Lấy tất cả phòng của khách sạn
    const allRooms = await Room.findAll({
      where: { id_hotel: hotel_id, is_available: true },
      attributes: ["id", "loaichonghi", "sotien"],
    });

    // Nhóm khuyến mãi theo name
    const groupedPromotions = promotions.reduce((acc: any, promotion: any) => {
      const key = promotion.name || "Khuyến mãi không tên";
      if (!acc[key]) {
        acc[key] = {
          promotions: [],
          roomIds: new Set(),
        };
      }
      acc[key].promotions.push(promotion);
      if (promotion.id_room) {
        acc[key].roomIds.add(promotion.id_room);
      }
      return acc;
    }, {});

    // Xử lý dữ liệu trả về
    const result = await Promise.all(
      Object.entries(groupedPromotions).map(
        async ([name, { promotions, roomIds }]: any) => {
          // Lấy bản ghi mới nhất để đại diện
          const latestPromotion = promotions[0];

          // Xác định phòng áp dụng
          const rooms = latestPromotion.id_room
            ? promotions
                .map((p: any) => p.Room)
                .filter((r: any) => r && r.loaichonghi && r.sotien) // Lọc phòng hợp lệ
            : allRooms;

          // Nhóm phòng theo loaichonghi
          const roomDetails = rooms.reduce((acc: any, room: any) => {
            if (!room || !room.loaichonghi || !room.sotien) {
              return acc;
            }
            const existing = acc.find(
              (d: any) => d.room_type === room.loaichonghi
            );
            if (existing) {
              existing.room_count += 1;
            } else {
              const discounted_price =
                latestPromotion.discount_type === "PERCENTAGE"
                  ? room.sotien * (1 - latestPromotion.discount_value / 100)
                  : room.sotien - latestPromotion.discount_value;
              acc.push({
                room_type: room.loaichonghi,
                room_count: 1,
                original_price: room.sotien,
                discounted_price: Math.max(0, Math.round(discounted_price)),
              });
            }
            return acc;
          }, []);

          return {
            name,
            discount:
              latestPromotion.discount_type === "PERCENTAGE"
                ? `${latestPromotion.discount_value}%`
                : `${latestPromotion.discount_value} VND`,
            apply_period: `${moment(latestPromotion.start_date).format(
              "DD/MM/YYYY"
            )} - ${moment(latestPromotion.end_date).format("DD/MM/YYYY")}`,
            total_rooms: latestPromotion.id_room
              ? roomIds.size
              : allRooms.length,
            details: roomDetails,
          };
        }
      )
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa khuyến mãi
export const deletePromotion = async (req: any, res: any) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "ID khuyến mãi không hợp lệ" });
  }

  try {
    // Tìm khuyến mãi cần xóa
    const promotion = await Promotion.findByPk(id);

    if (!promotion) {
      return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
    }

    // Kiểm tra xem có phải khuyến mãi hệ thống không
    if (promotion.id_hotel !== null) {
      return res
        .status(403)
        .json({ message: "Chỉ có thể xóa khuyến mãi hệ thống" });
    }

    // Xóa khuyến mãi
    await promotion.destroy();

    res.status(200).json({
      message: "Xóa khuyến mãi thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật khuyến mãi
export const updatePromotion = async (req: any, res: any) => {
  const { id } = req.params;
  const {
    name,
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    minStay,
    bookingDaysInAdvance,
    isActive,
  } = req.body;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "ID khuyến mãi không hợp lệ" });
  }

  // Kiểm tra discountType
  if (discountType && !["PERCENTAGE", "FIXED"].includes(discountType)) {
    return res.status(400).json({ message: "Loại giảm giá không hợp lệ" });
  }

  try {
    // Tìm khuyến mãi cần cập nhật
    const promotion = await Promotion.findByPk(id);

    if (!promotion) {
      return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
    }

    // Kiểm tra xem có phải khuyến mãi hệ thống không
    if (promotion.id_hotel !== null) {
      return res
        .status(403)
        .json({ message: "Chỉ có thể cập nhật khuyến mãi hệ thống" });
    }

    // Cập nhật thông tin
    await promotion.update({
      name: name || promotion.name,
      description:
        description !== undefined ? description : promotion.description,
      discount_type: discountType || promotion.discount_type,
      discount_value:
        discountValue !== undefined ? discountValue : promotion.discount_value,
      start_date: startDate || promotion.start_date,
      end_date: endDate || promotion.end_date,
      min_stay: minStay !== undefined ? minStay : promotion.min_stay,
      booking_days_in_advance:
        bookingDaysInAdvance !== undefined
          ? bookingDaysInAdvance
          : promotion.booking_days_in_advance,
      is_active: isActive !== undefined ? isActive : promotion.is_active,
    });

    res.status(200).json({
      message: "Cập nhật khuyến mãi thành công",
      promotion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
