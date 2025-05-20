import { Role, User, Hotel, BookingHotel } from "../../models/index";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JWT_SECRET } from "../../config/constants";
import { Op } from "sequelize";
dotenv.config();

export const loginWithGoogle = async (req: any, res: any) => {
  const { email, photo, lastname, firstname } = req.body;
  try {
    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        email,
        lastname,
        firstname,
        image_url: photo || "",
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET || "", {
      expiresIn: "7days",
    });

    res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Login failed", error });
  }
};

export const getInfoUser = async (req: any, res: any) => {
  try {
    const user = await User.findOne({ where: { id: req.body.user.id } });
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Get info user failed", error });
  }
};

export const getUser = async (req: any, res: any) => {
  const { role_name } = req.params;
  try {
    const role = await Role.findAll({
      where: { role_name: role_name },
      raw: true,
    });
    if (role.length > 0) {
      const user = await Promise.all(
        role.map(async (item: any) => {
          const result = await User.findOne({
            where: { id: item.id_user },
            raw: true,
          });
          return { ...item, ...result, key: result?.id };
        })
      );
      res.status(200).json(user);
      return;
    }
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};

// Lấy tất cả người dùng với vai trò
export const getAllUsers = async (req: any, res: any) => {
  try {
    // Lấy tất cả người dùng
    const users = await User.findAll({
      attributes: [
        "id",
        "firstname",
        "lastname",
        "email",
        "phonenumber",
        "image_url",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    // Lấy tất cả vai trò
    const roles = await Role.findAll({
      attributes: ["id_user", "role_name"],
    });

    // Map vai trò vào người dùng
    const usersWithRoles = users.map((user: any) => {
      const userRoles = roles.filter((role: any) => role.id_user === user.id);
      const roleNames = userRoles.map((role: any) => role.role_name);

      return {
        ...user.toJSON(),
        roles: roleNames,
        role: roleNames.length > 0 ? roleNames.join(", ") : "khachhang",
      };
    });

    res.status(200).json(usersWithRoles);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users", error });
  }
};

// Chi tiết người dùng thông thường (lịch sử đặt phòng)
export const getUserDetails = async (req: any, res: any) => {
  const { userId } = req.params;

  try {
    // Kiểm tra người dùng tồn tại
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Lấy lịch sử đặt phòng
    const bookings = await BookingHotel.findAll({
      where: { id_user: userId },
      include: [
        {
          model: Hotel,
          attributes: ["id", "name", "address", "images"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Thống kê
    const statistics = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(
        (booking: any) => booking.status === "completed"
      ).length,
      cancelledBookings: bookings.filter(
        (booking: any) => booking.status === "cancelled"
      ).length,
      upcomingBookings: bookings.filter(
        (booking: any) =>
          booking.status === "confirmed" &&
          new Date(booking.checkin_date) > new Date()
      ).length,
      totalSpent: bookings.reduce(
        (sum: number, booking: any) =>
          booking.status !== "cancelled"
            ? sum + Number(booking.total_price)
            : sum,
        0
      ),
    };

    res.status(200).json({
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber,
        image_url: user.image_url,
      },
      statistics,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details", error });
  }
};

// Chi tiết quản lý khách sạn
export const getHotelManagerDetails = async (req: any, res: any) => {
  const { userId } = req.params;

  try {
    // Kiểm tra người dùng tồn tại
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra vai trò quản lý
    const managerRole = await Role.findOne({
      where: {
        id_user: userId,
        role_name: "quanly",
      },
    });

    if (!managerRole) {
      return res.status(403).json({ message: "User is not a hotel manager" });
    }

    // Lấy danh sách khách sạn quản lý
    const hotels = await Hotel.findAll({
      where: { id_user: userId },
      attributes: ["id", "name", "address", "images", "rate", "createdAt"],
    });

    // Lấy thống kê đặt phòng cho từng khách sạn
    const hotelsWithStats = await Promise.all(
      hotels.map(async (hotel: any) => {
        const bookings = await BookingHotel.findAll({
          where: { id_hotel: hotel.id },
        });

        return {
          ...hotel.toJSON(),
          statistics: {
            totalBookings: bookings.length,
            completedBookings: bookings.filter(
              (b: any) => b.status === "completed"
            ).length,
            cancelledBookings: bookings.filter(
              (b: any) => b.status === "cancelled"
            ).length,
            upcomingBookings: bookings.filter(
              (b: any) =>
                b.status === "confirmed" &&
                new Date(b.checkin_date) > new Date()
            ).length,
            totalRevenue: bookings.reduce(
              (sum: number, b: any) =>
                b.status !== "cancelled" ? sum + Number(b.total_price) : sum,
              0
            ),
          },
        };
      })
    );

    res.status(200).json({
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber,
        image_url: user.image_url,
      },
      hotels: hotelsWithStats,
    });
  } catch (error) {
    console.error("Error fetching hotel manager details:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch hotel manager details", error });
  }
};
