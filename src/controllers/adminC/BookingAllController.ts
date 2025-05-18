import { Request, Response } from "express";
import {
  BookingDetail,
  BookingHotel,
  Hotel,
  Type_Hotel,
  User,
  Room,
} from "../../models/index";
import { Op } from "sequelize";
import moment from "moment";
import {
  generateExcelFile,
  sendEmailWithAttachment,
  createReconciliationEmailTemplate,
} from "../../utils/excelUtils";

const getBookingall = async (req: Request, res: Response) => {
  try {
    const booking = await BookingHotel.findAll({ raw: true });
    if (booking) {
      const bookingall = await Promise.all(
        booking.map(async (item) => {
          const bookingdetail = await BookingDetail.findOne({
            where: { id_booking_hotel: item.id },
            raw: true,
          });
          return { ...bookingdetail, ...item, key: item.id };
        })
      );
      res.status(200).json(bookingall);
      return;
    }
    res.status(202).json({ notifi: "Không tìm thấy dữ liệu!!!" });
    return;
  } catch (err) {
    res.status(500).json({ err: err });
    return;
  }
};

const getBookinghotel = async (req: Request, res: Response) => {
  try {
    const booking = await BookingHotel.findAll({ raw: true });
    if (booking) {
      const bookingall = await Promise.all(
        booking.map(async (item) => {
          const hotel = await Hotel.findOne({
            where: { id: item.id_hotel },
            raw: true,
          });
          const user = await User.findOne({ where: { id: item.id_user } });
          const bookingdetail = await BookingDetail.findOne({
            where: { id_booking_hotel: item.id },
            raw: true,
          });
          return {
            ...bookingdetail,
            ...item,
            key: item.id,
            hotel: hotel,
            user: user,
          };
        })
      );
      res.status(200).json(bookingall);
      return;
    }
    res.status(202).json({ notifi: "Không tìm thấy dữ liệu!!!" });
    return;
  } catch (err) {
    res.status(500).json({ err: err });
    return;
  }
};

const thongkehotel = async (req: Request, res: Response) => {
  try {
    const hotel = (await Hotel.findAll({ raw: true })).map((item) => {
      return { ...item, key: item.id };
    });
    res.status(201).json(hotel);
    return;
  } catch (err) {
    res.status(500).json({ err: err });
    return;
  }
};

const thongkeloaihotel = async (req: Request, res: Response) => {
  try {
    const typehotel = (await Type_Hotel.findAll({ raw: true })).map((item) => {
      return { ...item, key: item.id };
    });
    res.status(201).json(typehotel);
    return;
  } catch (err) {
    res.status(500).json({ err: err });
    return;
  }
};

/**
 * Đối soát doanh thu của khách sạn
 */
const doiSoatDoanhThu = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hotelId } = req.query;

    // Xây dựng điều kiện tìm kiếm
    let whereCondition: any = {
      status: "CONFIRMED",
    };

    // Thêm điều kiện thời gian nếu có
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [
          moment(startDate as string)
            .startOf("day")
            .toDate(),
          moment(endDate as string)
            .endOf("day")
            .toDate(),
        ],
      };
    }

    // Thêm điều kiện khách sạn nếu có
    if (hotelId && hotelId !== "all") {
      whereCondition.id_hotel = hotelId;
    }

    // Lấy tất cả đơn đặt phòng đã xác nhận
    const bookings = await BookingHotel.findAll({
      where: whereCondition,
      include: [
        {
          model: Hotel,
          attributes: ["id", "name", "address", "city", "country"],
        },
        {
          model: BookingDetail,
          include: [
            {
              model: Room,
              attributes: ["id", "nameroom", "sotien"],
            },
          ],
        },
      ],
    });

    // Chuyển đổi dữ liệu sang plain object
    const plainBookings = bookings.map((booking) =>
      booking.get({ plain: true })
    );

    // Tính toán thống kê cho từng khách sạn
    const hotelStats = new Map();

    for (const booking of plainBookings) {
      const hotelId = booking.id_hotel;
      const hotelName = booking.Hotel?.name || `Khách sạn ID: ${hotelId}`;

      if (!hotelStats.has(hotelId)) {
        hotelStats.set(hotelId, {
          id: hotelId,
          name: hotelName,
          address: booking.Hotel?.address || "",
          city: booking.Hotel?.city || "",
          country: booking.Hotel?.country || "",
          totalBookings: 0,
          totalRevenue: 0,
          commission: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          remainingAmount: 0,
          bookings: [],
        });
      }

      const stats = hotelStats.get(hotelId);
      stats.totalBookings += 1;

      // Tính tổng doanh thu và hoa hồng từ chi tiết đặt phòng
      let bookingRevenue = 0;
      let bookingCommission = 0;

      for (const detail of booking.BookingDetails || []) {
        const roomPrice = detail.Room?.sotien || 0;
        const quantity = detail.quantity || 0;
        const nights = moment(detail.checkout_date).diff(
          moment(detail.checkin_date),
          "days"
        );

        const detailRevenue = roomPrice * quantity * nights;
        // Hoa hồng 15% chỉ tính một lần trên giá phòng
        const detailCommission = roomPrice * 0.15;

        bookingRevenue += detailRevenue;
        bookingCommission += detailCommission;
      }

      stats.totalRevenue += bookingRevenue;
      stats.commission += bookingCommission;

      // Cập nhật số tiền đã thanh toán/chưa thanh toán
      if (booking.is_paid) {
        stats.paidAmount += bookingRevenue;
      } else {
        stats.unpaidAmount += bookingRevenue;
      }

      // Thêm thông tin đơn đặt phòng
      stats.bookings.push({
        id: booking.id,
        checkin_date: booking.checkin_date,
        checkout_date: booking.checkout_date,
        total_price: booking.total_price,
        status: booking.status,
        is_paid: booking.is_paid,
        payment_method: booking.payment_method,
        revenue: bookingRevenue,
        commission: bookingCommission,
      });
    }

    // Tính số tiền còn lại phải trả cho chủ khách sạn
    for (const stats of hotelStats.values()) {
      stats.remainingAmount = stats.totalRevenue - stats.commission;
    }

    // Tính tổng thống kê
    const totalStats = {
      totalBookings: plainBookings.length,
      totalRevenue: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.totalRevenue,
        0
      ),
      totalCommission: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.commission,
        0
      ),
      totalPaid: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.paidAmount,
        0
      ),
      totalUnpaid: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.unpaidAmount,
        0
      ),
      totalRemaining: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.remainingAmount,
        0
      ),
    };

    // Chuyển Map thành mảng để trả về
    const hotelStatsArray = Array.from(hotelStats.values());

    res.status(200).json({
      hotels: hotelStatsArray,
      total: totalStats,
    });
  } catch (error) {
    console.error("Lỗi khi đối soát doanh thu:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi đối soát doanh thu", error });
  }
};

/**
 * Đối soát doanh thu của khách sạn theo tháng
 */
const doiSoatDoanhThuTheoThang = async (req: Request, res: Response) => {
  try {
    const { year, month, hotelId } = req.query;

    // Kiểm tra và chuyển đổi tham số
    const selectedYear = year
      ? parseInt(year as string)
      : new Date().getFullYear();
    const selectedMonth = month
      ? parseInt(month as string) - 1
      : new Date().getMonth(); // JS months are 0-11

    // Tạo ngày đầu tháng và cuối tháng
    const startOfMonth = moment([selectedYear, selectedMonth])
      .startOf("month")
      .toDate();
    const endOfMonth = moment([selectedYear, selectedMonth])
      .endOf("month")
      .toDate();

    // Xây dựng điều kiện tìm kiếm
    let whereCondition: any = {
      status: "CONFIRMED",
      createdAt: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    };

    // Thêm điều kiện khách sạn nếu có
    if (hotelId && hotelId !== "all") {
      whereCondition.id_hotel = hotelId;
    }

    // Lấy tất cả đơn đặt phòng đã xác nhận trong tháng
    const bookings = await BookingHotel.findAll({
      where: whereCondition,
      include: [
        {
          model: Hotel,
          attributes: ["id", "name", "address", "city", "country"],
        },
        {
          model: BookingDetail,
          include: [
            {
              model: Room,
              attributes: ["id", "nameroom", "sotien"],
            },
          ],
        },
      ],
    });

    // Chuyển đổi dữ liệu sang plain object
    const plainBookings = bookings.map((booking) =>
      booking.get({ plain: true })
    );

    // Tính toán thống kê cho từng khách sạn
    const hotelStats = new Map();

    for (const booking of plainBookings) {
      const hotelId = booking.id_hotel;
      const hotelName = booking.Hotel?.name || `Khách sạn ID: ${hotelId}`;

      if (!hotelStats.has(hotelId)) {
        hotelStats.set(hotelId, {
          id: hotelId,
          name: hotelName,
          address: booking.Hotel?.address || "",
          city: booking.Hotel?.city || "",
          country: booking.Hotel?.country || "",
          totalBookings: 0,
          totalRevenue: 0,
          commission: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          remainingAmount: 0,
          bookings: [],
        });
      }

      const stats = hotelStats.get(hotelId);
      stats.totalBookings += 1;

      // Tính tổng doanh thu và hoa hồng từ chi tiết đặt phòng
      let bookingRevenue = 0;
      let bookingCommission = 0;

      for (const detail of booking.BookingDetails || []) {
        const roomPrice = detail.Room?.sotien || 0;
        const quantity = detail.quantity || 0;
        const nights = moment(detail.checkout_date).diff(
          moment(detail.checkin_date),
          "days"
        );

        const detailRevenue = roomPrice * quantity * nights;
        // Hoa hồng 15% chỉ tính một lần trên giá phòng
        const detailCommission = roomPrice * 0.15;

        bookingRevenue += detailRevenue;
        bookingCommission += detailCommission;
      }

      stats.totalRevenue += bookingRevenue;
      stats.commission += bookingCommission;

      // Cập nhật số tiền đã thanh toán/chưa thanh toán
      if (booking.is_paid) {
        stats.paidAmount += bookingRevenue;
      } else {
        stats.unpaidAmount += bookingRevenue;
      }

      // Thêm thông tin đơn đặt phòng
      stats.bookings.push({
        id: booking.id,
        checkin_date: booking.checkin_date,
        checkout_date: booking.checkout_date,
        total_price: booking.total_price,
        status: booking.status,
        is_paid: booking.is_paid,
        payment_method: booking.payment_method,
        revenue: bookingRevenue,
        commission: bookingCommission,
      });
    }

    // Tính số tiền còn lại phải trả cho chủ khách sạn
    for (const stats of hotelStats.values()) {
      stats.remainingAmount = stats.totalRevenue - stats.commission;
    }

    // Tính tổng thống kê
    const totalStats = {
      totalBookings: plainBookings.length,
      totalRevenue: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.totalRevenue,
        0
      ),
      totalCommission: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.commission,
        0
      ),
      totalPaid: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.paidAmount,
        0
      ),
      totalUnpaid: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.unpaidAmount,
        0
      ),
      totalRemaining: Array.from(hotelStats.values()).reduce(
        (sum, hotel) => sum + hotel.remainingAmount,
        0
      ),
    };

    // Chuyển Map thành mảng để trả về
    const hotelStatsArray = Array.from(hotelStats.values());

    // Thêm thông tin tháng và năm vào kết quả
    const result = {
      month: selectedMonth + 1,
      year: selectedYear,
      monthName: moment([selectedYear, selectedMonth]).format("MMMM"),
      hotels: hotelStatsArray,
      total: totalStats,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi đối soát doanh thu theo tháng:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi đối soát doanh thu theo tháng", error });
  }
};

/**
 * Gửi thông tin đối soát doanh thu theo tháng cho chủ khách sạn
 */
const sendReconciliationReport = async (req: any, res: any) => {
  try {
    const { hotelId, month, year } = req.body;

    if (!hotelId) {
      return res.status(400).json({ message: "Thiếu thông tin khách sạn" });
    }

    // Lấy thông tin khách sạn
    const hotel = await Hotel.findByPk(hotelId, {
      include: [
        {
          model: User,
          attributes: ["id", "email", "firstname", "lastname"],
        },
      ],
    });

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    const hotelObj = hotel.get({ plain: true });
    const ownerEmail = hotelObj.User?.email;

    if (!ownerEmail) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy email chủ khách sạn" });
    }

    // Tính toán thời gian nếu không được cung cấp
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    const selectedMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    // Tạo ngày đầu tháng và cuối tháng
    const startOfMonth = moment([selectedYear, selectedMonth])
      .startOf("month")
      .toDate();
    const endOfMonth = moment([selectedYear, selectedMonth])
      .endOf("month")
      .toDate();

    // Lấy tất cả đơn đặt phòng đã xác nhận trong tháng
    const bookings = await BookingHotel.findAll({
      where: {
        id_hotel: hotelId,
        status: "CONFIRMED",
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      include: [
        {
          model: Hotel,
          attributes: ["id", "name", "address", "city", "country"],
        },
        {
          model: User,
          attributes: ["id", "email", "firstname", "lastname"],
        },
        {
          model: BookingDetail,
          include: [
            {
              model: Room,
              attributes: ["id", "nameroom", "sotien"],
            },
          ],
        },
      ],
    });

    // Chuyển đổi dữ liệu sang plain object
    const plainBookings = bookings.map((booking) =>
      booking.get({ plain: true })
    );

    if (plainBookings.length === 0) {
      return res.status(200).json({
        message: "Không có dữ liệu đặt phòng trong tháng này",
        success: false,
      });
    }

    // Tính tổng doanh thu và hoa hồng
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    // Dữ liệu cho file Excel
    const excelData = plainBookings.map((booking) => {
      let bookingRevenue = 0;
      let bookingCommission = 0;

      // Tính doanh thu và hoa hồng từ từng booking detail
      for (const detail of booking.BookingDetails || []) {
        const roomPrice = detail.Room?.sotien || 0;
        const quantity = detail.quantity || 0;
        const nights = moment(detail.checkout_date).diff(
          moment(detail.checkin_date),
          "days"
        );

        const detailRevenue = roomPrice * quantity * nights;
        const detailCommission = roomPrice * 0.15;

        bookingRevenue += detailRevenue;
        bookingCommission += detailCommission;
      }

      // Cập nhật tổng
      totalRevenue += bookingRevenue;
      totalCommission += bookingCommission;

      if (booking.is_paid) {
        totalPaid += bookingRevenue;
      } else {
        totalUnpaid += bookingRevenue;
      }

      // Trả về dữ liệu cho từng dòng trong Excel
      return {
        "Mã đơn đặt": `BK${booking.id.toString().padStart(4, "0")}`,
        "Ngày đặt": moment(booking.createdAt).format("DD/MM/YYYY"),
        "Ngày nhận phòng": moment(booking.checkin_date).format("DD/MM/YYYY"),
        "Ngày trả phòng": moment(booking.checkout_date).format("DD/MM/YYYY"),
        "Khách hàng": booking.User
          ? `${booking.User.firstname || ""} ${booking.User.lastname || ""}`
          : "Không xác định",
        "Email khách": booking.User?.email || "Không có",
        "Số điện thoại": booking.phone || "Không có",
        "Thông tin phòng": booking.BookingDetails.map(
          (detail: any) =>
            `${detail.Room?.nameroom || "Phòng"} x${detail.quantity}`
        ).join(", "),
        "Số ngày":
          booking.BookingDetails.length > 0
            ? moment(booking.BookingDetails[0].checkout_date).diff(
                moment(booking.BookingDetails[0].checkin_date),
                "days"
              )
            : 0,
        "Tiền phòng gốc": booking.BookingDetails.map(
          (detail: any) => detail.Room?.sotien || 0
        ).reduce((sum: number, price: number) => sum + price, 0),
        "Tổng doanh thu": bookingRevenue,
        "Hoa hồng (15%)": bookingCommission,
        "Thực nhận": bookingRevenue - bookingCommission,
        "Trạng thái thanh toán": booking.is_paid
          ? "Đã thanh toán"
          : "Chưa thanh toán",
        "Phương thức thanh toán":
          booking.payment_method === "CASH" ? "Tiền mặt" : "Thẻ tín dụng",
      };
    });

    // Thêm dòng tổng kết vào cuối
    excelData.push({
      "Mã đơn đặt": "TỔNG CỘNG",
      "Ngày đặt": "",
      "Ngày nhận phòng": "",
      "Ngày trả phòng": "",
      "Khách hàng": "",
      "Email khách": "",
      "Số điện thoại": "",
      "Thông tin phòng": "",
      "Số ngày": 0,
      "Tiền phòng gốc": "",
      "Tổng doanh thu": totalRevenue,
      "Hoa hồng (15%)": totalCommission,
      "Thực nhận": totalRevenue - totalCommission,
      "Trạng thái thanh toán": "",
      "Phương thức thanh toán": "",
    });

    // Tạo file Excel
    const filename = `doi-soat-${hotelObj.name.replace(/\s+/g, "-")}-${
      selectedMonth + 1
    }-${selectedYear}.xlsx`;
    const filePath = await generateExcelFile(excelData, filename);

    // Tạo email HTML
    const emailHtml = createReconciliationEmailTemplate(
      hotelObj.name,
      selectedMonth + 1,
      selectedYear,
      {
        totalBookings: plainBookings.length,
        totalRevenue,
        totalCommission,
        remainingAmount: totalRevenue - totalCommission,
      }
    );

    // Gửi email với file đính kèm
    await sendEmailWithAttachment(
      ownerEmail,
      `Báo cáo đối soát doanh thu tháng ${selectedMonth + 1}/${selectedYear}`,
      emailHtml,
      filePath,
      filename
    );

    // Trả về thành công
    res.status(200).json({
      message: `Đã gửi báo cáo đối soát tháng ${
        selectedMonth + 1
      }/${selectedYear} đến ${ownerEmail}`,
      success: true,
      reportData: {
        hotelName: hotelObj.name,
        month: selectedMonth + 1,
        year: selectedYear,
        totalBookings: plainBookings.length,
        totalRevenue,
        totalCommission,
        totalPaid,
        totalUnpaid,
        remainingAmount: totalRevenue - totalCommission,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gửi báo cáo đối soát:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi gửi báo cáo đối soát", error });
  }
};

export {
  getBookingall,
  getBookinghotel,
  thongkehotel,
  thongkeloaihotel,
  doiSoatDoanhThu,
  doiSoatDoanhThuTheoThang,
  sendReconciliationReport,
};
