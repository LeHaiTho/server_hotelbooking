import { Request, Response } from "express";
import sequelize from "../config/sequelize";
import { Op, fn, col } from "sequelize";
import { BookingHotel, Room, Rating, Hotel } from "../models";
import moment from "moment";

export const getHotelStats = async (req: any, res: any) => {
  try {
    const { hotelId } = req.params;
    const { month = "2025-05" } = req.query;

    // Kiểm tra khách sạn tồn tại
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Khách sạn không tồn tại" });
    }

    // Lấy danh sách đặt phòng trong tháng
    const bookings = await BookingHotel.findAll({
      where: {
        id_hotel: hotelId,
        checkin_date: {
          [Op.gte]: `${month}-01`,
          [Op.lte]: `${month}-31`,
        },
      },
      attributes: [
        "id",
        "status",
        "total_price",
        "checkin_date",
        "total_quantity",
      ],
    });

    // Tính tổng doanh thu (COMPLETED, CONFIRMED)
    const totalRevenue =
      (await BookingHotel.sum("total_price", {
        where: {
          id_hotel: hotelId,
          status: ["CONFIRMED"],
          checkin_date: {
            [Op.gte]: `${month}-01`,
            [Op.lte]: `${month}-31`,
          },
        },
      })) || 0;

    // Tính số lượng đặt phòng theo trạng thái
    const statusCounts = await BookingHotel.findAll({
      where: {
        id_hotel: hotelId,
        checkin_date: {
          [Op.gte]: `${month}-01`,
          [Op.lte]: `${month}-31`,
        },
      },
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      group: ["status"],
    });

    const statusMap = {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    statusCounts.forEach((item: any) => {
      statusMap[item.status as keyof typeof statusMap] = item.get("count");
    });

    const totalBookings = Object.values(statusMap).reduce(
      (sum: number, count: number) => sum + count,
      0
    );
    const cancellationRate = totalBookings
      ? ((statusMap.CANCELLED / totalBookings) * 100).toFixed(2)
      : "0.00";

    // Tính tỷ lệ lấp đầy
    const totalRooms = await Room.count({
      where: { id_hotel: hotelId },
    });
    const bookedRooms = bookings
      .filter((b) => ["PENDING", "CONFIRMED"].includes(b.status))
      .reduce((sum: number, b: any) => sum + (b.total_quantity || 0), 0);
    const occupancyRate = totalRooms
      ? ((bookedRooms / totalRooms) * 100).toFixed(2)
      : "0.00";

    // Tính đánh giá trung bình
    const ratings = await Rating.findAll({
      where: {
        hotel_id: hotelId,
        isDeleted: false,
        stay_date: {
          [Op.gte]: `${month}-01`,
          [Op.lte]: `${month}-31`,
        },
      },
      attributes: ["overall"],
    });
    const averageRating = ratings.length
      ? (
          ratings.reduce((sum: number, r: any) => sum + (r.overall || 0), 0) /
          ratings.length
        ).toFixed(1)
      : "0.0";

    // Doanh thu theo tháng (năm 2025)
    const revenueByMonth = await BookingHotel.findAll({
      where: {
        id_hotel: hotelId,
        status: ["CONFIRMED"],
        checkin_date: {
          [Op.gte]: "2025-01-01",
          [Op.lte]: "2025-12-31",
        },
      },
      attributes: [
        [fn("TO_CHAR", col("checkin_date"), "YYYY-MM"), "month"],
        [fn("SUM", col("total_price")), "revenue"],
      ],
      group: ["month"],
      order: [["month", "ASC"]],
    });

    const revenueData = Array(12).fill(0);
    revenueByMonth.forEach((item: any) => {
      const monthIndex = parseInt(item.get("month").split("-")[1], 10) - 1;
      revenueData[monthIndex] = item.get("revenue");
    });

    // Số lượng đặt phòng theo ngày
    const daysInMonth = moment(month as string, "YYYY-MM").daysInMonth();
    const bookingsByDay = await BookingHotel.findAll({
      where: {
        id_hotel: hotelId,
        checkin_date: {
          [Op.gte]: `${month}-01`,
          [Op.lte]: `${month}-31`,
        },
      },
      attributes: [
        [fn("TO_CHAR", col("checkin_date"), "DD"), "day"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["day"],
      order: [["day", "ASC"]],
    });

    const bookingDayData = Array(daysInMonth).fill(0);
    bookingsByDay.forEach((item: any) => {
      const dayIndex = parseInt(item.get("day"), 10) - 1;
      bookingDayData[dayIndex] = item.get("count");
    });

    // Response
    const stats = {
      totalRevenue,
      totalBookings,
      statusCounts: statusMap,
      cancellationRate,
      occupancyRate,
      averageRating,
      revenueByMonth: revenueData,
      bookingsByDay: bookingDayData,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê khách sạn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
