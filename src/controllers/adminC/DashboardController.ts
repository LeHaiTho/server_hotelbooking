import { Request, Response } from "express";
import {
  BookingHotel,
  BookingDetail,
  Hotel,
  Room,
  User,
} from "../../models/index";
import { Op } from "sequelize";
import moment from "moment";
import sequelize from "../../config/sequelize";

/**
 * Lấy thống kê tổng quan cho dashboard admin
 */
const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Lấy thời gian hiện tại và đầu tháng
    const now = new Date();
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    // 1. Tổng số đơn đặt phòng đã xác nhận
    const totalBookings = await BookingHotel.count({
      where: {
        status: "CONFIRMED",
      },
    });

    // 2. Tổng doanh thu từ đơn đã xác nhận
    const totalRevenue =
      (await BookingHotel.sum("total_price", {
        where: {
          status: "CONFIRMED",
        },
      })) || 0;

    // 3. Tổng số tiền thanh toán bằng tiền mặt
    const cashPayments =
      (await BookingHotel.sum("total_price", {
        where: {
          status: "CONFIRMED",
          payment_method: "CASH",
        },
      })) || 0;

    // 4. Tổng số tiền thanh toán bằng thẻ tín dụng
    const cardPayments =
      (await BookingHotel.sum("total_price", {
        where: {
          status: "CONFIRMED",
          payment_method: "CREDIT_CARD",
        },
      })) || 0;

    // 5. Phần trăm đơn chưa thanh toán (trong số đơn đã xác nhận)
    const unpaidBookings = await BookingHotel.count({
      where: {
        status: "CONFIRMED",
        is_paid: false,
      },
    });

    const unpaidPercentage =
      totalBookings > 0
        ? Math.round((unpaidBookings / totalBookings) * 100)
        : 0;

    // 6. Số lượng phòng đã sử dụng
    const totalRooms = await Room.count();
    const bookedRooms = await BookingDetail.count({
      distinct: true,
      col: "id_room",
      where: {
        status: "CONFIRMED",
        checkin_date: {
          [Op.lte]: now,
        },
        checkout_date: {
          [Op.gte]: now,
        },
      },
    });

    // 7. Doanh thu theo ngày trong tháng hiện tại
    const dailyRevenue = await BookingHotel.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [sequelize.fn("SUM", sequelize.col("total_price")), "revenue"],
      ],
      where: {
        status: "CONFIRMED",
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      raw: true,
      order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
    });

    // Định dạng dữ liệu doanh thu theo ngày
    const formattedDailyRevenue = dailyRevenue.map((item: any) => ({
      date: moment(item.date).format("D/M"),
      revenue: Math.round(Number(item.revenue) / 1000000), // Chuyển đổi sang đơn vị triệu đồng
    }));

    // 8. Tổng doanh thu trong tháng
    const monthlyRevenue =
      (await BookingHotel.sum("total_price", {
        where: {
          status: "CONFIRMED",
          createdAt: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      })) || 0;

    // Trả về kết quả
    res.status(200).json({
      totalBookings,
      totalRevenue,
      cashPayments,
      cardPayments,
      unpaidPercentage,
      roomsUsage: {
        used: bookedRooms,
        total: totalRooms,
      },
      dailyRevenue: formattedDailyRevenue,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê dashboard:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy thống kê dashboard", error });
  }
};

export { getDashboardStats };
