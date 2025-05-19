import nodemailer from "nodemailer";
import cron from "node-cron";
import { BookingHotel, Hotel, User } from "../models";
import { format, addMinutes, isBefore } from "date-fns";
import { AppName } from "../config/constants";
import { Op } from "sequelize";

// Cấu hình transporter cho nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm gửi email
const sendEmail = async (
  toEmail: string,
  subject: string,
  htmlContent: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email reminder sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return false;
  }
};

// Tạo nội dung email nhắc lịch
const createReminderEmailContent = (booking: any, hotel: any, user: any) => {
  const checkInDate = format(new Date(booking.checkin_date), "dd/MM/yyyy");
  const checkOutDate = format(new Date(booking.checkout_date), "dd/MM/yyyy");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; text-align: left; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #007bff; text-align: center;">Nhắc nhở lịch đặt phòng</h1>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Xin chào ${user.firstname} ${
    user.lastname
  },</h2>
        <p>Chúng tôi xin nhắc bạn về lịch đặt phòng sắp tới tại ${
          hotel.name
        }.</p>
      </div>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Chi tiết đặt phòng</h2>
        <p><strong>Mã đặt phòng:</strong> #${booking.id}</p>
        <p><strong>Khách sạn:</strong> ${hotel.name}</p>
        <p><strong>Địa chỉ:</strong> ${hotel.address}</p>
        <p><strong>Ngày nhận phòng:</strong> ${checkInDate}</p>
        <p><strong>Ngày trả phòng:</strong> ${checkOutDate}</p>
      </div>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Lưu ý quan trọng</h2>
        <ul>
          <li>Vui lòng mang theo giấy tờ tùy thân khi nhận phòng</li>
          <li>Thời gian nhận phòng thông thường từ 14:00</li>
          <li>Thời gian trả phòng thông thường trước 12:00</li>
          <li>Nếu bạn cần hỗ trợ, vui lòng liên hệ với khách sạn theo số điện thoại: ${
            hotel.phone || "Chưa cung cấp"
          }</li>
        </ul>
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
};

// Lưu trữ các job đang chạy
const activeJobs = new Map();

// Lập lịch gửi email nhắc nhở sau khi đặt phòng thành công
export const scheduleBookingReminder = async (bookingId: number) => {
  try {
    // Nếu đã có job cho booking này, hủy job cũ
    if (activeJobs.has(bookingId)) {
      const oldJob = activeJobs.get(bookingId);
      oldJob.stop();
      activeJobs.delete(bookingId);
    }

    // Đặt thời gian gửi email (2 phút sau khi đặt phòng)
    const scheduledTime = addMinutes(new Date(), 2);

    console.log(
      `Reminder scheduled for booking #${bookingId} at ${format(
        scheduledTime,
        "HH:mm:ss dd/MM/yyyy"
      )}`
    );

    // Tạo một cron job chạy mỗi phút để kiểm tra
    const job = cron.schedule("* * * * *", async () => {
      const now = new Date();

      // Kiểm tra xem đã đến thời gian gửi email chưa
      if (isBefore(scheduledTime, now)) {
        try {
          // Lấy thông tin đặt phòng
          const booking = await BookingHotel.findByPk(bookingId, {
            include: [
              {
                model: Hotel,
                as: "Hotel",
              },
              {
                model: User,
                as: "User",
              },
            ],
          });

          if (!booking) {
            console.log(`Booking #${bookingId} not found, cancelling reminder`);
            job.stop();
            activeJobs.delete(bookingId);
            return;
          }

          const plainBooking = booking.get({ plain: true });
          const hotel = plainBooking.Hotel;
          const user = plainBooking.User;

          if (!user || !user.email) {
            console.log(
              `User email not found for booking #${bookingId}, cancelling reminder`
            );
            job.stop();
            activeJobs.delete(bookingId);
            return;
          }

          // Tạo nội dung email
          const emailContent = createReminderEmailContent(
            plainBooking,
            hotel,
            user
          );

          // Gửi email
          await sendEmail(
            user.email,
            `Nhắc nhở lịch đặt phòng tại ${hotel.name}`,
            emailContent
          );

          console.log(`Reminder email sent for booking #${bookingId}`);
        } catch (error) {
          console.error(
            `Error sending reminder for booking #${bookingId}:`,
            error
          );
        } finally {
          // Dừng cron job sau khi gửi email
          job.stop();
          activeJobs.delete(bookingId);
        }
      }
    });

    // Lưu job vào map để có thể tham chiếu sau này
    activeJobs.set(bookingId, job);

    return true;
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return false;
  }
};

// Gửi email nhắc lịch ngay lập tức
export const sendImmediateReminder = async (bookingId: number) => {
  try {
    // Lấy thông tin đặt phòng
    const booking = await BookingHotel.findByPk(bookingId, {
      include: [
        {
          model: Hotel,
          as: "Hotel",
        },
        {
          model: User,
          as: "User",
        },
      ],
    });

    if (!booking) {
      console.log(`Booking #${bookingId} not found`);
      return false;
    }

    const plainBooking = booking.get({ plain: true });
    const hotel = plainBooking.Hotel;
    const user = plainBooking.User;

    if (!user || !user.email) {
      console.log(`User email not found for booking #${bookingId}`);
      return false;
    }

    // Tạo nội dung email
    const emailContent = createReminderEmailContent(plainBooking, hotel, user);

    // Gửi email
    const result = await sendEmail(
      user.email,
      `Nhắc nhở lịch đặt phòng tại ${hotel.name}`,
      emailContent
    );

    console.log(
      `Immediate reminder email ${
        result ? "sent" : "failed"
      } for booking #${bookingId}`
    );

    return result;
  } catch (error) {
    console.error("Error sending immediate reminder:", error);
    return false;
  }
};

// Lập lịch gửi email nhắc nhở trước ngày check-in
export const scheduleCheckInReminder = async (
  bookingId: number,
  daysBeforeCheckIn: number = 1
) => {
  try {
    // Lấy thông tin đặt phòng
    const booking = await BookingHotel.findByPk(bookingId, {
      include: [
        {
          model: Hotel,
          as: "Hotel",
        },
        {
          model: User,
          as: "User",
        },
      ],
    });

    if (!booking) {
      console.log(`Booking #${bookingId} not found`);
      return false;
    }

    const plainBooking = booking.get({ plain: true });
    const checkInDate = new Date(plainBooking.checkin_date);

    // Tính ngày gửi nhắc nhở (trước ngày check-in daysBeforeCheckIn ngày)
    const reminderDate = new Date(checkInDate);
    reminderDate.setDate(reminderDate.getDate() - daysBeforeCheckIn);
    reminderDate.setHours(8, 0, 0, 0); // Đặt thời gian gửi là 8 giờ sáng

    // Nếu ngày nhắc nhở đã qua, không cần lập lịch
    if (isBefore(reminderDate, new Date())) {
      console.log(
        `Reminder date ${format(
          reminderDate,
          "dd/MM/yyyy HH:mm"
        )} has passed for booking #${bookingId}`
      );
      return false;
    }

    console.log(
      `Check-in reminder scheduled for booking #${bookingId} at ${format(
        reminderDate,
        "dd/MM/yyyy HH:mm"
      )}`
    );

    // Tạo cron expression từ ngày nhắc nhở
    const minute = reminderDate.getMinutes();
    const hour = reminderDate.getHours();
    const dayOfMonth = reminderDate.getDate();
    const month = reminderDate.getMonth() + 1; // getMonth() trả về 0-11

    const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} *`;

    // Nếu đã có job cho booking này, hủy job cũ
    if (activeJobs.has(`checkin_${bookingId}`)) {
      const oldJob = activeJobs.get(`checkin_${bookingId}`);
      oldJob.stop();
      activeJobs.delete(`checkin_${bookingId}`);
    }

    // Tạo cron job
    const job = cron.schedule(cronExpression, async () => {
      try {
        // Kiểm tra lại booking có còn tồn tại không
        const updatedBooking = await BookingHotel.findByPk(bookingId, {
          include: [
            {
              model: Hotel,
              as: "Hotel",
            },
            {
              model: User,
              as: "User",
            },
          ],
        });

        if (!updatedBooking || updatedBooking.status === "CANCELLED") {
          console.log(
            `Booking #${bookingId} no longer valid, cancelling check-in reminder`
          );
          job.stop();
          activeJobs.delete(`checkin_${bookingId}`);
          return;
        }

        const updatedPlainBooking = updatedBooking.get({ plain: true });
        const hotel = updatedPlainBooking.Hotel;
        const user = updatedPlainBooking.User;

        if (!user || !user.email) {
          console.log(
            `User email not found for booking #${bookingId}, cancelling check-in reminder`
          );
          job.stop();
          activeJobs.delete(`checkin_${bookingId}`);
          return;
        }

        // Tạo nội dung email
        const emailContent = createReminderEmailContent(
          updatedPlainBooking,
          hotel,
          user
        );

        // Gửi email
        await sendEmail(
          user.email,
          `Nhắc nhở lịch nhận phòng tại ${hotel.name} vào ngày mai`,
          emailContent
        );

        console.log(`Check-in reminder email sent for booking #${bookingId}`);
      } catch (error) {
        console.error(
          `Error sending check-in reminder for booking #${bookingId}:`,
          error
        );
      } finally {
        // Dừng cron job sau khi gửi email
        job.stop();
        activeJobs.delete(`checkin_${bookingId}`);
      }
    });

    // Lưu job vào map để có thể tham chiếu sau này
    activeJobs.set(`checkin_${bookingId}`, job);

    return true;
  } catch (error) {
    console.error("Error scheduling check-in reminder:", error);
    return false;
  }
};

// Khởi tạo cron job để kiểm tra và gửi email nhắc lịch hẹn hàng ngày
export const initDailyReminderCronJob = () => {
  console.log("Initializing daily reminder cron job...");

  // Lập lịch chạy mỗi ngày vào lúc 8 giờ sáng để gửi email nhắc lịch check-in
  const job = cron.schedule("0 8 * * *", async () => {
    try {
      console.log("Running daily check-in reminder job...");

      // Lấy danh sách các đặt phòng sắp check-in (trong 1 ngày tới)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingBookings = await BookingHotel.findAll({
        where: {
          checkin_date: {
            [Op.gte]: tomorrow,
            [Op.lt]: dayAfterTomorrow,
          },
          status: "CONFIRMED",
        },
        include: [
          {
            model: Hotel,
            as: "Hotel",
          },
          {
            model: User,
            as: "User",
          },
        ],
      });

      console.log(
        `Found ${upcomingBookings.length} upcoming bookings for reminder`
      );

      // Gửi email nhắc lịch cho từng đặt phòng
      for (const booking of upcomingBookings) {
        const plainBooking = booking.get({ plain: true });
        const hotel = plainBooking.Hotel;
        const user = plainBooking.User;

        if (!user || !user.email) {
          console.log(
            `User email not found for booking #${plainBooking.id}, skipping reminder`
          );
          continue;
        }

        // Tạo nội dung email
        const emailContent = createReminderEmailContent(
          plainBooking,
          hotel,
          user
        );

        // Gửi email
        await sendEmail(
          user.email,
          `Nhắc nhở lịch nhận phòng tại ${hotel.name} vào ngày mai`,
          emailContent
        );

        console.log(
          `Daily check-in reminder email sent for booking #${plainBooking.id}`
        );
      }
    } catch (error) {
      console.error("Error in daily reminder cron job:", error);
    }
  });

  return job;
};
