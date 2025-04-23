import { NextFunction, Request, Response } from "express";
import path from "path";
import { Op, fn, literal } from "sequelize";
import sequelize from "../config/sequelize";
import { BookingDetail, BookingHotel, Hotel, Room, User } from "../models";
import moment from "moment-timezone";
import axios from "axios";

export const createBooking = async (req: Request, res: Response) => {
  const { formData, hotelId, selectedRooms, searchCondition, payment } =
    req.body;

  const totalPrice = selectedRooms.reduce(
    (acc: number, room: any) => acc + room.roomPrice * room.quantity,
    0
  );

  try {
    const result = await sequelize.transaction(async (t) => {
      const booking: any = await BookingHotel.create(
        {
          id_user: 16,
          id_hotel: hotelId,
          total_price: totalPrice,
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
      if (payment === "CREDIT_CARD") {
        console.log({
          amount: totalPrice,
          bookingId: plainBooking.id,
        });
        try {
          // Gọi API ZaloPay để tạo yêu cầu thanh toán
          const paymentResponse = await axios.post(
            `http://localhost:5000/payment/create`,
            {
              amount: totalPrice,
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
      }

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
