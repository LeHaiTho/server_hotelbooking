import { NextFunction, Request, Response } from "express";
import { Room, RoomPriceAdjustment } from "../models";
import moment from "moment";
import sequelize from "../config/sequelize";

export const createPriceAdjustment = async (req: any, res: any, next: any) => {
  const {
    hotelId,
    roomIds,
    startDate,
    endDate,
    applyToDays,
    adjustmentType,
    adjustmentValue,
    reason,
  } = req.body;

  // Kiểm tra đầu vào
  if (
    !hotelId ||
    !roomIds ||
    !Array.isArray(roomIds) ||
    roomIds.length === 0 ||
    !startDate ||
    !endDate ||
    !adjustmentType ||
    !adjustmentValue
  ) {
    return res.status(400).json({ message: "Thiếu trường bắt buộc" });
  }

  // Kiểm tra ngày hợp lệ
  if (
    !moment(startDate).isValid() ||
    !moment(endDate).isValid() ||
    moment(startDate).isAfter(endDate)
  ) {
    return res.status(400).json({ message: "Ngày không hợp lệ" });
  }

  // Kiểm tra applyToDays
  if (
    applyToDays &&
    !applyToDays.every((day: number) => day >= 0 && day <= 6)
  ) {
    return res.status(400).json({ message: "Ngày trong tuần không hợp lệ" });
  }

  // Kiểm tra adjustmentType
  if (!["PERCENTAGE", "FIXED"].includes(adjustmentType)) {
    return res.status(400).json({ message: "Loại điều chỉnh không hợp lệ" });
  }

  try {
    // Kiểm tra quyền quản lý khách sạn
    const rooms = await Room.findAll({
      where: {
        id: roomIds,
        id_hotel: hotelId,
      },
    });

    if (rooms.length !== roomIds.length) {
      return res
        .status(403)
        .json({ message: "Một số phòng không thuộc khách sạn này" });
    }

    // Tạo bản ghi RoomPriceAdjustment
    const adjustments = await sequelize.transaction(async (t) => {
      const createdAdjustments = [];
      for (const roomId of roomIds) {
        const adjustment = await RoomPriceAdjustment.create(
          {
            id_room: roomId,
            start_date: startDate,
            end_date: endDate,
            apply_to_days: applyToDays || [0, 1, 2, 3, 4, 5, 6], // Mặc định tất cả ngày
            adjustment_type: adjustmentType,
            adjustment_value: adjustmentValue,
            reason,
          },
          { transaction: t }
        );
        createdAdjustments.push(adjustment);
      }
      return createdAdjustments;
    });

    res.status(201).json({
      message: "Tạo điều chỉnh giá thành công",
      adjustments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách RoomPriceAdjustment của khách sạn
export const getHotelRoomPriceAdjustments = async (req: any, res: any) => {
  const { hotel_id } = req.params;

  if (!hotel_id || isNaN(Number(hotel_id))) {
    return res.status(400).json({ message: "hotel_id không hợp lệ" });
  }

  try {
    // Lấy danh sách RoomPriceAdjustment
    const adjustments = await RoomPriceAdjustment.findAll({
      include: [
        {
          model: Room,
          where: { id_hotel: Number(hotel_id) },
          attributes: ["id", "loaichonghi", "sotien"],
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Nhóm các điều chỉnh theo start_date, end_date, adjustment_type, adjustment_value, reason, apply_to_days, và loaichonghi
    const groupedAdjustments = adjustments.reduce(
      (acc: any, adjustment: any) => {
        const roomType = adjustment.Room?.loaichonghi || "Không xác định";
        const key = [
          adjustment.start_date,
          adjustment.end_date,
          adjustment.adjustment_type,
          adjustment.adjustment_value,
          adjustment.reason || "",
          JSON.stringify(adjustment.apply_to_days || [0, 1, 2, 3, 4, 5, 6]),
          roomType,
        ].join("|");
        if (!acc[key]) {
          acc[key] = {
            adjustment,
            rooms: [],
          };
        }
        if (adjustment.Room) {
          acc[key].rooms.push(adjustment.Room);
        }
        return acc;
      },
      {}
    );

    // Xử lý dữ liệu trả về
    const result = Object.values(groupedAdjustments).map(
      ({ adjustment, rooms }: any) => ({
        adjustment_id: adjustment.id,
        start_date: moment(adjustment.start_date).format("YYYY-MM-DD"),
        end_date: moment(adjustment.end_date).format("YYYY-MM-DD"),
        adjustment_type: adjustment.adjustment_type,
        adjustment_value: adjustment.adjustment_value,
        reason: adjustment.reason || "Không có lý do",
        apply_to_days: adjustment.apply_to_days || [0, 1, 2, 3, 4, 5, 6],
        created_at: moment(adjustment.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        room_type: adjustment.Room?.loaichonghi || "Không xác định",
        rooms: rooms
          .filter((room: any) => room.loaichonghi && room.sotien !== undefined)
          .map((room: any) => ({
            room_id: room.id,
            room_type: room.loaichonghi,
            original_price: room.sotien,
          })),
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách điều chỉnh giá cho một phòng cụ thể
export const getRoomPriceAdjustments = async (req: any, res: any) => {
  const { hotel_id, room_id } = req.params;

  if (
    !hotel_id ||
    isNaN(Number(hotel_id)) ||
    !room_id ||
    isNaN(Number(room_id))
  ) {
    return res
      .status(400)
      .json({ message: "hotel_id hoặc room_id không hợp lệ" });
  }

  try {
    // Kiểm tra phòng có thuộc khách sạn không
    const room = await Room.findOne({
      where: {
        id: Number(room_id),
        id_hotel: Number(hotel_id),
      },
    });

    if (!room) {
      return res.status(404).json({
        message: "Phòng không tồn tại hoặc không thuộc khách sạn này",
      });
    }

    // Lấy danh sách điều chỉnh giá cho phòng
    const adjustments = await RoomPriceAdjustment.findAll({
      where: {
        id_room: Number(room_id),
      },
      order: [
        ["start_date", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    // Xử lý dữ liệu trả về
    const result = adjustments.map((adjustment: any) => ({
      adjustment_id: adjustment.id,
      start_date: moment(adjustment.start_date).format("YYYY-MM-DD"),
      end_date: moment(adjustment.end_date).format("YYYY-MM-DD"),
      adjustment_type: adjustment.adjustment_type,
      adjustment_value: adjustment.adjustment_value,
      reason: adjustment.reason || "Không có lý do",
      apply_to_days: adjustment.apply_to_days || [0, 1, 2, 3, 4, 5, 6],
      created_at: moment(adjustment.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
