import { NextFunction, Request, Response } from "express";
import path from "path";
import { Op, fn, literal } from "sequelize";
import sequelize from "../config/sequelize";
import {
  BookingDetail,
  BookingHistory,
  BookingHotel,
  Hotel,
  Promotion,
  Room,
  RoomPriceAdjustment,
  User,
} from "../models";
import moment from "moment-timezone";
import axios from "axios";
import nodemailer from "nodemailer";
import { AppName } from "../config/constants";
import {
  scheduleBookingReminder,
  sendImmediateReminder,
} from "../services/reminderService";

// Cấu hình transporter cho nodemailer (sao chép từ manageController.ts)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm gửi email (sao chép từ manageController.ts)
const sendEmail = async (
  toEmail: any,
  subject: any,
  textContent: any,
  htmlContent: any
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Địa chỉ email gửi đi
      to: toEmail, // Địa chỉ email người nhận
      subject: subject, // Chủ đề email
      text: textContent, // Nội dung văn bản
      html: htmlContent, // Nội dung HTML
    };
    console.log("mailOptions", mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Hàm gửi email xác nhận đặt phòng
const sendBookingConfirmationEmail = async (
  booking: any,
  formData: any,
  hotel: any,
  selectedRooms: any
) => {
  const checkInDate = moment(booking.checkin_date).format("DD/MM/YYYY");
  const checkOutDate = moment(booking.checkout_date).format("DD/MM/YYYY");
  const nights = moment(booking.checkout_date).diff(
    moment(booking.checkin_date),
    "days"
  );

  // Tạo danh sách phòng đã đặt
  const roomsList = selectedRooms
    .map(
      (room: any) =>
        `<li>${room.loaichonghi || "Phòng"} - ${room.quantity} phòng - ${Number(
          room.final_price
        ).toLocaleString()} VND</li>`
    )
    .join("");

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; text-align: left; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #007bff; text-align: center;">Xác nhận đặt phòng</h1>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Thông tin đặt phòng</h2>
        <p><strong>Mã đặt phòng:</strong> #${booking.id}</p>
        <p><strong>Khách sạn:</strong> ${hotel.name}</p>
        <p><strong>Địa chỉ:</strong> ${hotel.address}</p>
        <p><strong>Ngày nhận phòng:</strong> ${checkInDate}</p>
        <p><strong>Ngày trả phòng:</strong> ${checkOutDate}</p>
        <p><strong>Số đêm:</strong> ${nights}</p>
      </div>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Thông tin khách hàng</h2>
        <p><strong>Họ tên:</strong> ${formData.guest_firstname} ${
    formData.guest_lastname
  }</p>
        <p><strong>Email:</strong> ${formData.guest_email}</p>
        <p><strong>Số điện thoại:</strong> ${formData.guest_phone}</p>
      </div>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Chi tiết phòng</h2>
        <ul style="padding-left: 20px;">
          ${roomsList}
        </ul>
        <p style="font-weight: bold; font-size: 18px; margin-top: 15px;">Tổng tiền: ${Number(
          booking.total_price
        ).toLocaleString()} VND</p>
        <p><strong>Phương thức thanh toán:</strong> ${
          booking.payment_method === "CASH"
            ? "Tiền mặt tại khách sạn"
            : "Thanh toán trực tuyến"
        }</p>
      </div>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Chính sách hủy phòng</h2>
        <p>Bạn có thể hủy phòng miễn phí đến 18:00 ngày nhận phòng. Bạn sẽ phải trả toàn bộ tiền phòng nếu bạn hủy sau 18:00 ngày nhận phòng.</p>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        Bản quyền © 2025–2030 ${AppName}. Bảo lưu mọi quyền.
      </p>
      <p style="color: #999; font-size: 12px; text-align: center;">
        Email này được gửi bởi ${AppName}, Thủ Dầu Một, Bình Dương, Việt Nam.
      </p>
    </div>
  `;

  return await sendEmail(
    formData.guest_email,
    `Xác nhận đặt phòng #${booking.id}`,
    `Xác nhận đặt phòng tại ${hotel.name}`,
    htmlContent
  );
};

export const createBooking = async (req: Request, res: Response) => {
  const { formData, hotelId, selectedRooms, searchCondition, payment } =
    req.body;
  const user = req.body.user;

  const totalFinalPrice = selectedRooms.reduce(
    (acc: number, room: any) => acc + room.final_price * room.quantity,
    0
  );
  const totalInitialPrice = selectedRooms.reduce(
    (acc: number, room: any) => acc + room.initial_price * room.quantity,
    0
  );
  try {
    const result = await sequelize.transaction(async (t) => {
      // Lấy thông tin khách sạn
      const hotel = await Hotel.findByPk(hotelId, { transaction: t });

      if (!hotel) {
        throw new Error("Không tìm thấy thông tin khách sạn");
      }

      const booking: any = await BookingHotel.create(
        {
          id_user: user.id,
          id_hotel: hotelId,
          total_price: totalFinalPrice,
          status: "PENDING",
          checkin_date: searchCondition.checkInDate,
          checkout_date: searchCondition.checkOutDate,
          payment_method: payment,
          phone: formData.guest_phone,
          total_adult: searchCondition.capacity.adults,
        },
        { transaction: t }
      );

      const plainBooking = booking.get({ plain: true });

      // lấy id room dựa vào số phòng cần đặt
      // roomIds[16,17] - totalRoom = 1 => lấy 16
      // roomIds[16,17] - totalRoom = 2 => lấy 16,17
      // roomIds[16,17,18, 19] - totalRoom = 3 => lấy 16,17
      // Tạo các bản ghi booking Detail
      const bookingDetails = [];
      for (const room of selectedRooms) {
        const selectedRoomIds = room.roomIds.slice(0, room.quantity);
        for (const id of selectedRoomIds) {
          const item = {
            id_booking_hotel: plainBooking.id,
            id_room: id,
            checkin_date: searchCondition.checkInDate,
            checkout_date: searchCondition.checkOutDate,
            quantity: 1,
            price: room.roomPrice,
            status: "PENDING",
          };
          bookingDetails.push(item);
        }
      }
      await BookingDetail.bulkCreate(bookingDetails, { transaction: t });

      // Xử lý thanh toán
      if (payment === "CREDIT_CARD") {
        console.log({
          amount: totalFinalPrice,
          bookingId: plainBooking.id,
        });
        try {
          // Gọi API ZaloPay để tạo yêu cầu thanh toán
          const paymentResponse = await axios.post(
            `http://localhost:5000/payment/create`,
            {
              amount: totalFinalPrice,
              bookingId: plainBooking.id,
              description: `Thanh toán đặt phòng #${plainBooking.id}`,
            }
          );

          // Trả về URL thanh toán để frontend xử lý
          plainBooking.payment_url = paymentResponse.data.order_url;
        } catch (paymentError: any) {
          throw new Error(
            `Lỗi khi tạo thanh toán: ${
              paymentError.response?.data?.message || paymentError.message
            }`
          );
        }
      } else if (payment === "CASH") {
        // Gửi email xác nhận đặt phòng nếu thanh toán bằng tiền mặt
        await sendBookingConfirmationEmail(
          plainBooking,
          formData,
          hotel,
          selectedRooms
        );
      }

      // Lập lịch gửi email nhắc nhở sau 2 phút
      await scheduleBookingReminder(plainBooking.id);

      return plainBooking;
    });

    res.status(200).json({
      message: "Booking created successfully",
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

export const getBookingId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await BookingHotel.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Hotel,
          include: [
            {
              model: User,
            },
          ],
        },
        {
          model: BookingDetail,
        },
      ],
    });
    res.status(200).json({ booking });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

export const getUpcomingBookings = async (req: Request, res: Response) => {
  const user = req.body.user.id;
  const currentDate = new Date();
  const currentDateString = moment(currentDate)
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DD");
  console.log(currentDateString);

  try {
    const booking = await BookingHotel.findAll({
      where: {
        id_user: user,
        status: "PENDING",
        checkin_date: {
          [Op.gte]: currentDateString,
        },
      },
      include: [
        {
          model: Hotel,
          include: [
            {
              model: User,
            },
          ],
        },
        {
          model: BookingDetail,
        },
      ],
    });
    res.status(200).json({ result: booking });
  } catch (error) {
    console.log(error);
    // res.status(500).json({ message: error });
  }
};

export const getBookingByStatus = async (req: Request, res: Response) => {
  const user = req.body.user.id;
  const { status } = req.query;
  try {
    const booking = await BookingHotel.findAll({
      where: {
        id_user: user,
        status: status,
      },
      include: [
        {
          model: Hotel,
          include: [
            {
              model: User,
            },
          ],
        },
        {
          model: BookingDetail,
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
    res.status(200).json({ result: booking });
  } catch (error) {
    console.log(error);
    // res.status(500).json({ message: error });
  }
};

// CANCEL BOOKING
export const cancelBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.body;

  // 1. Kiểm tra đầu vào
  if (!bookingId) {
    res.status(400).json({
      message: "Thiếu trường bắt buộc: bookingId",
    });
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    // 2. Kiểm tra tồn tại BookingHotel
    const bookingHotel = await BookingHotel.findOne({
      where: { id: bookingId },
      transaction,
    });

    if (!bookingHotel) {
      await transaction.rollback();
      res.status(404).json({
        message: "Không tìm thấy thông tin đặt phòng",
      });
      return;
    }

    // Kiểm tra trạng thái hiện tại
    if (bookingHotel.status === "CANCELLED") {
      await transaction.rollback();
      res.status(400).json({
        message: "Đặt phòng đã được hủy trước đó",
      });
      return;
    }

    // 3. Cập nhật trạng thái BookingHotel
    await BookingHotel.update(
      {
        status: "CANCELLED",
        updatedAt: new Date(),
      },
      {
        where: { id: bookingId },
        transaction,
      }
    );

    // 4. Lấy và cập nhật trạng thái BookingDetail
    const bookingDetails = await BookingDetail.findAll({
      where: { id_booking_hotel: bookingId },
      transaction,
    });

    if (bookingDetails.length === 0) {
      await transaction.rollback();
      res.status(404).json({
        message: "Không tìm thấy chi tiết đặt phòng",
      });
      return;
    }

    // Cập nhật trạng thái tất cả BookingDetail
    await BookingDetail.update(
      {
        status: "CANCELLED",
        updatedAt: new Date(),
      },
      {
        where: { id_booking_hotel: bookingId },
        transaction,
      }
    );

    // 5. Lưu lịch sử thay đổi vào BookingHistory (nếu có bảng này)
    // for (const detail of bookingDetails) {
    //   await BookingHistory.create(
    //     {
    //       id_booking_hotel: bookingId,
    //       id_booking_detail: detail.id,
    //       old_checkin_date: detail.checkin_date,
    //       old_checkout_date: detail.checkout_date,
    //       new_checkin_date: detail.checkin_date, // Giữ nguyên vì chỉ hủy
    //       new_checkout_date: detail.checkout_date, // Giữ nguyên vì chỉ hủy
    //       changed_by: cancelledBy || bookingHotel.id_user, // Người thực hiện hủy
    //       reason: reason || "Khách yêu cầu hủy đặt phòng",
    //     },
    //     { transaction }
    //   );
    // }

    // 6. Commit transaction
    await transaction.commit();

    // 7. Trả về kết quả
    res.status(200).json({
      message: "Đặt phòng đã được hủy thành công",
      data: {
        bookingId,
        status: "CANCELLED",
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error cancelling booking:", err);
    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// Thêm API endpoint mới để gửi email xác nhận đặt phòng
export const sendBookingConfirmationEmailManually = async (
  req: any,
  res: any
) => {
  const { bookingId } = req.params;
  const { formData } = req.body;

  try {
    // Lấy thông tin đặt phòng
    const booking = await BookingHotel.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Hotel,
        },
        {
          model: BookingDetail,
          include: [
            {
              model: Room,
            },
          ],
        },
      ],
    });

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin đặt phòng" });
    }

    // Chuẩn bị dữ liệu cho email
    const plainBooking = booking.get({ plain: true });
    const hotel = plainBooking.Hotel;

    // Tạo danh sách phòng từ booking details
    const selectedRooms = plainBooking.BookingDetails.map((detail: any) => ({
      loaichonghi: detail.Room.loaichonghi,
      quantity: 1,
      final_price: detail.price,
    }));

    // Gộp các phòng cùng loại
    const roomGroups: any = {};
    selectedRooms.forEach((room: any) => {
      if (!roomGroups[room.loaichonghi]) {
        roomGroups[room.loaichonghi] = {
          loaichonghi: room.loaichonghi,
          quantity: 0,
          final_price: room.final_price,
        };
      }
      roomGroups[room.loaichonghi].quantity += 1;
    });

    const groupedRooms = Object.values(roomGroups);

    // Gửi email
    const emailSent = await sendBookingConfirmationEmail(
      plainBooking,
      formData,
      hotel,
      groupedRooms
    );

    if (emailSent) {
      res
        .status(200)
        .json({ message: "Email xác nhận đã được gửi thành công" });
    } else {
      res.status(500).json({ message: "Không thể gửi email xác nhận" });
    }
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    res.status(500).json({ message: "Lỗi server khi gửi email xác nhận" });
  }
};

// Cập nhật trạng thái thanh toán
export const updatePaymentStatus = async (req: any, res: any) => {
  const { bookingId, status } = req.body;
  console.log("bookingId", bookingId);
  console.log("status", status);

  if (!bookingId || !status) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
  }

  try {
    const booking = await BookingHotel.findByPk(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin đặt phòng" });
    }

    // Cập nhật trạng thái thanh toán
    await booking.update({
      is_paid: status === "SUCCESS",
      payment_status: status,
      // Nếu thanh toán thành công, cập nhật trạng thái đặt phòng thành CONFIRMED
      ...(status === "SUCCESS" ? { status: "CONFIRMED" } : {}),
    });

    // Cập nhật trạng thái các booking detail
    if (status === "SUCCESS") {
      await BookingDetail.update(
        { status: "CONFIRMED" },
        { where: { id_booking_hotel: bookingId } }
      );
    }

    res.status(200).json({
      message: "Cập nhật trạng thái thanh toán thành công",
      booking,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật trạng thái thanh toán" });
  }
};

// Thêm API endpoint mới để gửi email nhắc lịch thủ công
export const sendBookingReminder = async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  try {
    const success = await sendImmediateReminder(parseInt(bookingId));

    if (success) {
      res
        .status(200)
        .json({ message: "Email nhắc lịch đã được gửi thành công" });
    } else {
      res.status(500).json({ message: "Không thể gửi email nhắc lịch" });
    }
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ message: "Lỗi server khi gửi email nhắc lịch" });
  }
};

export const getRevenueReport = async (req: any, res: any) => {
  try {
    const { hotelId } = req.params;
    console.log("hotelId", hotelId);
    const { status, checkin_date } = req.query;

    // Xây dựng điều kiện lọc
    const where: any = { id_hotel: hotelId };
    if (status) {
      where.status = status;
    }
    if (checkin_date) {
      where.checkin_date = {
        [Op.eq]: checkin_date,
      };
    }

    // Lấy danh sách đặt phòng
    const bookings = await BookingHotel.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "firstname", "lastname", "phonenumber", "email"],
        },
        {
          model: Hotel,
          attributes: ["id", "name", "address"],
          include: [
            {
              model: Room,
              attributes: [
                "id",
                "id_hotel",
                "nameroom",
                "sotien",
                "soluongkhach",
              ],
              include: [
                {
                  model: Promotion,
                  attributes: [
                    "id",
                    "id_hotel",
                    "id_room",
                    "name",
                    "discount_type",
                    "discount_value",
                    "start_date",
                    "end_date",
                    "is_active",
                  ],
                  where: { is_active: true },
                  required: false,
                },
                {
                  model: RoomPriceAdjustment,
                  attributes: [
                    "id",
                    "id_room",
                    "reason",
                    "adjustment_type",
                    "adjustment_value",
                    "apply_to_days",
                    "start_date",
                    "end_date",
                  ],
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: BookingHistory,
          attributes: [
            "id",
            "id_booking_hotel",
            "old_checkin_date",
            "old_checkout_date",
            "new_checkin_date",
            "new_checkout_date",
            "changed_by",
            "changed_at",
            "reason",
          ],
          required: false,
        },
      ],
      order: [["checkin_date", "DESC"]], // Sắp xếp theo checkin_date giảm dần
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm API endpoint mới để check-in (chuyển trạng thái từ PENDING sang CONFIRMED)
export const checkInBooking = async (req: any, res: any) => {
  const { bookingId } = req.params;

  if (!bookingId) {
    return res.status(400).json({ message: "Thiếu ID đặt phòng" });
  }

  const transaction = await sequelize.transaction();

  try {
    // Tìm booking cần check-in
    const booking = await BookingHotel.findByPk(bookingId, { transaction });

    if (!booking) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin đặt phòng" });
    }

    // Kiểm tra trạng thái hiện tại
    if (booking.status !== "PENDING") {
      await transaction.rollback();
      return res.status(400).json({
        message:
          booking.status === "CONFIRMED"
            ? "Đặt phòng đã được check-in trước đó"
            : "Không thể check-in đặt phòng đã hủy",
      });
    }

    // Cập nhật trạng thái BookingHotel
    await BookingHotel.update(
      {
        status: "CONFIRMED",
        updatedAt: new Date(),
      },
      {
        where: { id: bookingId },
        transaction,
      }
    );

    // Cập nhật trạng thái BookingDetail
    const bookingDetails = await BookingDetail.findAll({
      where: { id_booking_hotel: bookingId },
      transaction,
    });

    if (bookingDetails.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Không tìm thấy chi tiết đặt phòng",
      });
    }

    // Cập nhật trạng thái tất cả BookingDetail
    await BookingDetail.update(
      {
        status: "CONFIRMED",
        updatedAt: new Date(),
      },
      {
        where: { id_booking_hotel: bookingId },
        transaction,
      }
    );

    // Commit transaction
    await transaction.commit();

    // Lấy thông tin booking đã cập nhật để trả về
    const updatedBooking = await BookingHotel.findByPk(bookingId, {
      include: [
        {
          model: User,
          attributes: ["id", "firstname", "lastname", "phonenumber", "email"],
        },
        {
          model: Hotel,
          attributes: ["id", "name", "address"],
        },
        {
          model: BookingDetail,
          include: [
            {
              model: Room,
            },
          ],
        },
      ],
    });

    res.status(200).json({
      message: "Check-in thành công",
      booking: updatedBooking,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error during check-in:", error);
    res.status(500).json({ message: "Lỗi server khi thực hiện check-in" });
  }
};
