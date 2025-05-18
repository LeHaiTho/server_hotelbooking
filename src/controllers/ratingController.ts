import { Request, Response } from "express";
import { Rating, User, Hotel, BookingHotel } from "../models";
import sequelize from "../config/sequelize";
import { Op } from "sequelize";

// Create a new rating
const createRating = async (req: any, res: any) => {
  const {
    hotelId,
    bookingId,
    overall,
    staff,
    facility,
    comfortable,
    clean,
    money,
    location,
    comment,
  } = req.body;

  const userId = req.body.user?.id; // Get user ID from token
  console.log("userId", userId);
  console.log("bookingId", bookingId); // Log để debug
  console.log("hotelId", hotelId);

  // Kiểm tra bookingId có tồn tại không
  if (!bookingId) {
    return res.status(400).json({
      message: "Thiếu thông tin booking ID",
    });
  }

  try {
    // Check if user has stayed at this hotel before
    const hasBooking = await BookingHotel.findOne({
      where: {
        id: bookingId,
        id_user: userId,
        id_hotel: hotelId,
        status: "CONFIRMED",
      },
    });

    if (!hasBooking) {
      return res.status(403).json({
        message: "Bạn chỉ có thể đánh giá khách sạn sau khi đã lưu trú",
      });
    }

    // Check if user has already rated this specific booking
    const existingRating = await Rating.findOne({
      where: {
        user_id: userId,
        hotel_id: hotelId,
        booking_hotel_id: bookingId,
      },
    });

    if (existingRating) {
      // Update existing rating
      await existingRating.update({
        overall,
        staff,
        facility,
        comfortable,
        clean,
        money,
        location,
        comment,
        updatedAt: new Date(),
      });

      return res.status(200).json({
        message: "Cập nhật đánh giá thành công",
        rating: existingRating,
      });
    }

    // Create new rating
    const rating = await Rating.create({
      user_id: userId,
      hotel_id: hotelId,
      booking_hotel_id: bookingId,
      overall,
      staff,
      facility,
      comfortable,
      clean,
      money,
      location,
      comment,
      stay_date: hasBooking.checkout_date,
    });

    res.status(201).json({
      message: "Đánh giá thành công",
      rating,
    });
  } catch (error) {
    console.error("Error creating rating:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Get all ratings for a hotel with calculated averages
const getHotelRatings = async (req: any, res: any) => {
  const { hotelId } = req.params;

  try {
    // Find all non-deleted ratings for this hotel
    const ratings = await Rating.findAll({
      where: {
        hotel_id: hotelId,
        isDeleted: false,
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstname", "lastname", "image_url"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate statistics
    const totalRatings = ratings.length;

    if (totalRatings === 0) {
      return res.status(200).json({
        ratings: [],
        stats: {
          total: 0,
          averageOverall: 0,
          averageStaff: 0,
          averageFacility: 0,
          averageComfortable: 0,
          averageClean: 0,
          averageMoney: 0,
          averageLocation: 0,
          normalizedAverage: 0,
        },
      });
    }

    // Calculate sums for each category
    const sums = ratings.reduce(
      (acc, rating) => {
        return {
          overall: acc.overall + (rating.overall || 0),
          staff: acc.staff + (rating.staff || 0),
          facility: acc.facility + (rating.facility || 0),
          comfortable: acc.comfortable + (rating.comfortable || 0),
          clean: acc.clean + (rating.clean || 0),
          money: acc.money + (rating.money || 0),
          location: acc.location + (rating.location || 0),
        };
      },
      {
        overall: 0,
        staff: 0,
        facility: 0,
        comfortable: 0,
        clean: 0,
        money: 0,
        location: 0,
      }
    );

    // Calculate averages
    const averageOverall = sums.overall / totalRatings;
    const averageStaff = sums.staff / totalRatings;
    const averageFacility = sums.facility / totalRatings;
    const averageComfortable = sums.comfortable / totalRatings;
    const averageClean = sums.clean / totalRatings;
    const averageMoney = sums.money / totalRatings;
    const averageLocation = sums.location / totalRatings;

    // Normalize other ratings to 10-point scale (they are on 4-point scale)
    const normalizedStaff = (averageStaff / 4) * 10;
    const normalizedFacility = (averageFacility / 4) * 10;
    const normalizedComfortable = (averageComfortable / 4) * 10;
    const normalizedClean = (averageClean / 4) * 10;
    const normalizedMoney = (averageMoney / 4) * 10;
    const normalizedLocation = (averageLocation / 4) * 10;

    // Calculate overall normalized average (all categories have equal weight)
    const normalizedAverage =
      (averageOverall +
        normalizedStaff +
        normalizedFacility +
        normalizedComfortable +
        normalizedClean +
        normalizedMoney +
        normalizedLocation) /
      7;

    // Format ratings to include user information and format dates
    const formattedRatings = ratings.map((rating) => {
      const plainRating = rating.get({ plain: true });

      // Format user information
      if (plainRating.User) {
        plainRating.User = {
          id: plainRating.User.id,
          name: `${plainRating.User.firstname || ""} ${
            plainRating.User.lastname || ""
          }`.trim(),
          image_url: plainRating.User.image_url,
        };
      }

      // Format dates
      if (plainRating.stay_date) {
        plainRating.stay_date_formatted = new Date(
          plainRating.stay_date
        ).toLocaleDateString("vi-VN");
      }

      return plainRating;
    });

    res.status(200).json({
      ratings: formattedRatings,
      stats: {
        total: totalRatings,
        averageOverall: parseFloat(averageOverall.toFixed(1)),
        averageStaff: parseFloat(averageStaff.toFixed(1)),
        averageFacility: parseFloat(averageFacility.toFixed(1)),
        averageComfortable: parseFloat(averageComfortable.toFixed(1)),
        averageClean: parseFloat(averageClean.toFixed(1)),
        averageMoney: parseFloat(averageMoney.toFixed(1)),
        averageLocation: parseFloat(averageLocation.toFixed(1)),
        // Normalized values (all on 10-point scale)
        normalizedStaff: parseFloat(normalizedStaff.toFixed(1)),
        normalizedFacility: parseFloat(normalizedFacility.toFixed(1)),
        normalizedComfortable: parseFloat(normalizedComfortable.toFixed(1)),
        normalizedClean: parseFloat(normalizedClean.toFixed(1)),
        normalizedMoney: parseFloat(normalizedMoney.toFixed(1)),
        normalizedLocation: parseFloat(normalizedLocation.toFixed(1)),
        // Overall average of all categories
        normalizedAverage: parseFloat(normalizedAverage.toFixed(1)),
      },
    });
  } catch (error) {
    console.error("Error fetching hotel ratings:", error);
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá khách sạn" });
  }
};

// Get ratings by user
const getUnreviewedHotels = async (req: Request, res: Response) => {
  const userId = req.body.user?.id; // Get user ID from token

  try {
    const unreviewedHotels = await BookingHotel.findAll({
      where: {
        id_user: userId,
        status: "CONFIRMED",
        // checkout_date: {
        //   [Op.lt]: new Date(), // Only allow rating after checkout
        // },
      },
      include: [
        {
          model: Hotel,
          attributes: ["id", "name", "images"],
          include: [
            {
              model: Rating,
              where: {
                user_id: userId,
              },
              required: false,
            },
          ],
        },
      ],
      order: [["checkout_date", "DESC"]],
    });
    res.status(200).json({ unreviewedHotels });
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Get hotels that haven't been rated by the user
const getUnratedHotels = async (req: Request, res: Response) => {
  const userId = req.body.user?.id; // Get user ID from token

  try {
    // Tìm tất cả các đặt phòng đã xác nhận của người dùng
    const bookings = await BookingHotel.findAll({
      where: {
        id_user: userId,
        status: "CONFIRMED",
      },
      include: [
        {
          model: Hotel,
          attributes: ["id", "name", "images"],
        },
      ],
      order: [["checkout_date", "DESC"]],
    });

    // Nhóm các đặt phòng theo khách sạn
    const hotelBookings = bookings.reduce((acc: any, booking: any) => {
      const hotelId = booking.id_hotel;
      if (!acc[hotelId]) {
        acc[hotelId] = [];
      }
      acc[hotelId].push(booking);
      return acc;
    }, {});

    // Tìm các đánh giá đã tồn tại của người dùng
    const existingRatings = await Rating.findAll({
      where: {
        user_id: userId,
        isDeleted: false,
      },
      attributes: ["hotel_id", "booking_hotel_id", "stay_date"],
    });

    // Tạo map các khách sạn đã đánh giá
    const ratedHotelBookings = existingRatings.reduce(
      (acc: any, rating: any) => {
        if (!acc[rating.hotel_id]) {
          acc[rating.hotel_id] = new Set();
        }
        // Thêm booking_hotel_id vào set để đánh dấu đã đánh giá
        acc[rating.hotel_id].add(rating.booking_hotel_id);
        return acc;
      },
      {}
    );

    // Lọc ra các khách sạn chưa được đánh giá hoặc có lần đặt phòng mới chưa đánh giá
    const unreviewedHotels = [];

    for (const [hotelId, bookings] of Object.entries(hotelBookings)) {
      const ratedBookingIds = ratedHotelBookings[hotelId] || new Set();

      // Tìm các lần đặt phòng chưa được đánh giá
      const unratedBookings = (bookings as any[]).filter(
        (booking) => !ratedBookingIds.has(booking.id)
      );

      if (unratedBookings.length > 0) {
        // Chỉ lấy lần đặt phòng gần nhất chưa đánh giá
        unreviewedHotels.push(unratedBookings[0]);
      }
    }

    res.status(200).json({
      unreviewedHotels,
      count: unreviewedHotels.length,
    });
  } catch (error) {
    console.error("Error fetching unrated hotels:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Get ratings for hotels owned by a specific user
const getHotelOwnerRatings = async (req: any, res: any) => {
  const ownerId = req.body.user?.id; // Get hotel owner ID from token

  try {
    // Find all hotels owned by this user
    const hotels = await Hotel.findAll({
      where: {
        id_user: ownerId,
      },
      attributes: ["id", "name", "images", "rate"],
    });

    if (hotels.length === 0) {
      return res.status(200).json({
        message: "Không tìm thấy khách sạn nào thuộc sở hữu của bạn",
        hotels: [],
        totalRatings: 0,
      });
    }

    const hotelIds = hotels.map((hotel) => hotel.id);

    // Get all ratings for these hotels
    const ratings = await Rating.findAll({
      where: {
        hotel_id: hotelIds,
        // isDeleted: false,
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstname", "lastname", "email", "image_url"],
        },
        {
          model: Hotel,
          attributes: ["id", "name", "images"],
        },
        {
          model: BookingHotel,
          attributes: ["id", "checkin_date", "checkout_date", "total_price"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format the ratings data
    const formattedRatings = ratings.map((rating) => {
      const plainRating = rating.get({ plain: true });

      return {
        id: plainRating.id,
        hotel: {
          id: plainRating.Hotel?.id,
          name: plainRating.Hotel?.name,
          image: plainRating.Hotel?.images?.split(",")[0] || "",
        },
        user: {
          id: plainRating.User?.id,
          name: `${plainRating.User?.firstname || ""} ${
            plainRating.User?.lastname || ""
          }`.trim(),
          email: plainRating.User?.email,
          image: plainRating.User?.image_url,
        },
        booking: {
          id: plainRating.BookingHotel?.id,
          checkin: plainRating.BookingHotel?.checkin_date
            ? new Date(
                plainRating.BookingHotel.checkin_date
              ).toLocaleDateString("vi-VN")
            : null,
          checkout: plainRating.BookingHotel?.checkout_date
            ? new Date(
                plainRating.BookingHotel.checkout_date
              ).toLocaleDateString("vi-VN")
            : null,
        },
        rating: {
          overall: plainRating.overall,
          staff: plainRating.staff,
          facility: plainRating.facility,
          comfortable: plainRating.comfortable,
          clean: plainRating.clean,
          money: plainRating.money,
          location: plainRating.location,
          comment: plainRating.comment,
          date: new Date(plainRating.createdAt).toLocaleDateString("vi-VN"),
        },
      };
    });

    // Group ratings by hotel
    const ratingsByHotel = hotels.map((hotel) => {
      const hotelRatings = formattedRatings.filter(
        (rating) => rating.hotel.id === hotel.id
      );

      // Calculate average ratings for this hotel
      let totalOverall = 0;
      let totalNormalized = 0;

      if (hotelRatings.length > 0) {
        hotelRatings.forEach((rating) => {
          totalOverall += rating.rating.overall;

          // Normalize other ratings from 1-4 scale to 1-10 scale
          const normalizedStaff = ((rating.rating.staff - 1) / 3) * 9 + 1;
          const normalizedFacility = ((rating.rating.facility - 1) / 3) * 9 + 1;
          const normalizedComfortable =
            ((rating.rating.comfortable - 1) / 3) * 9 + 1;
          const normalizedClean = ((rating.rating.clean - 1) / 3) * 9 + 1;
          const normalizedMoney = ((rating.rating.money - 1) / 3) * 9 + 1;
          const normalizedLocation = ((rating.rating.location - 1) / 3) * 9 + 1;

          // Calculate the average of all normalized ratings
          totalNormalized +=
            (rating.rating.overall +
              normalizedStaff +
              normalizedFacility +
              normalizedComfortable +
              normalizedClean +
              normalizedMoney +
              normalizedLocation) /
            7;
        });
      }

      return {
        hotel: {
          id: hotel.id,
          name: hotel.name,
          image: hotel.images?.split(",")[0] || "",
          rate: hotel.rate,
        },
        ratings: hotelRatings,
        stats: {
          count: hotelRatings.length,
          averageOverall:
            hotelRatings.length > 0
              ? parseFloat((totalOverall / hotelRatings.length).toFixed(1))
              : 0,
          averageNormalized:
            hotelRatings.length > 0
              ? parseFloat((totalNormalized / hotelRatings.length).toFixed(1))
              : 0,
        },
      };
    });

    res.status(200).json({
      hotels: ratingsByHotel,
      totalRatings: ratings.length,
    });
  } catch (error) {
    console.error("Error fetching hotel owner ratings:", error);
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá khách sạn" });
  }
};

// Hide a rating (set isDeleted to true)
const hideRating = async (req: any, res: any) => {
  const { ratingId } = req.params;
  const userId = req.body.user?.id; // Get user ID from token

  try {
    // Find the rating
    const rating = await Rating.findByPk(ratingId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Check if the hotel belongs to the user
    const hotel = await Hotel.findByPk(rating.hotel_id);

    if (!hotel || hotel.id_user !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền ẩn đánh giá này",
      });
    }

    // Update the rating to set isDeleted to true
    await rating.update({
      isDeleted: true,
    });

    res.status(200).json({
      success: true,
      message: "Đã ẩn đánh giá thành công",
    });
  } catch (error) {
    console.error("Error hiding rating:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi ẩn đánh giá",
    });
  }
};

// Delete a rating permanently
const deleteRating = async (req: any, res: any) => {
  const { ratingId } = req.params;
  const userId = req.body.user?.id; // Get user ID from token

  try {
    // Find the rating
    const rating = await Rating.findByPk(ratingId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Check if the hotel belongs to the user
    const hotel = await Hotel.findByPk(rating.hotel_id);

    if (!hotel || hotel.id_user !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa đánh giá này",
      });
    }

    // Delete the rating
    await rating.destroy();

    res.status(200).json({
      success: true,
      message: "Đã xóa đánh giá thành công",
    });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa đánh giá",
    });
  }
};

// Thêm hàm mới để lấy danh sách khách sạn đã đánh giá
const getRatedHotels = async (req: Request, res: Response) => {
  const userId = req.body.user?.id; // Get user ID from token

  try {
    // Tìm tất cả đánh giá của người dùng
    const ratings = await Rating.findAll({
      where: {
        user_id: userId,
        isDeleted: false,
      },
      include: [
        {
          model: BookingHotel,
          include: [
            {
              model: Hotel,
              attributes: ["id", "name", "images"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format dữ liệu để phù hợp với UI
    const ratedHotels = ratings.map((rating) => {
      const plainRating = rating.get({ plain: true });
      return {
        id: plainRating.booking_hotel_id,
        Hotel: plainRating.BookingHotel.Hotel,
        checkin_date: plainRating.BookingHotel.checkin_date,
        checkout_date: plainRating.BookingHotel.checkout_date,
        rating: {
          id: plainRating.id,
          overall: plainRating.overall,
          staff: plainRating.staff,
          facility: plainRating.facility,
          comfortable: plainRating.comfortable,
          clean: plainRating.clean,
          money: plainRating.money,
          location: plainRating.location,
          comment: plainRating.comment,
          createdAt: plainRating.createdAt,
        },
      };
    });

    res.status(200).json({
      ratedHotels,
      count: ratedHotels.length,
    });
  } catch (error) {
    console.error("Error fetching rated hotels:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật hàm getUnratedHotels để trả về cả khách sạn đã đánh giá và chưa đánh giá
const getAllUserHotels = async (req: any, res: any) => {
  const userId = req.body.user?.id; // Get user ID from token

  try {
    // Lấy tất cả các đặt phòng đã xác nhận
    const bookings = await BookingHotel.findAll({
      where: {
        id_user: userId,
        status: "CONFIRMED",
      },
      include: [
        {
          model: Hotel,
          attributes: ["id", "name", "images"],
        },
      ],
      order: [["checkout_date", "DESC"]],
    });

    // Lấy tất cả đánh giá của người dùng
    const ratings = await Rating.findAll({
      where: {
        user_id: userId,
        isDeleted: false,
      },
      attributes: [
        "id",
        "hotel_id",
        "booking_hotel_id",
        "overall",
        "comment",
        "createdAt",
      ],
    });

    // Tạo map các booking đã đánh giá
    const ratedBookings = new Map();
    ratings.forEach((rating: any) => {
      ratedBookings.set(rating.booking_hotel_id, {
        id: rating.id,
        overall: rating.overall,
        comment: rating.comment,
        createdAt: rating.createdAt,
      });
    });

    // Phân loại các booking
    const unratedHotels: any[] = [];
    const ratedHotels: any[] = [];

    bookings.forEach((booking) => {
      const plainBooking = booking.get({ plain: true });
      const rating = ratedBookings.get(plainBooking.id);

      if (rating) {
        // Đã đánh giá
        ratedHotels.push({
          ...plainBooking,
          rating,
        });
      } else {
        // Chưa đánh giá
        unratedHotels.push(plainBooking);
      }
    });

    res.status(200).json({
      unratedHotels,
      ratedHotels,
      unratedCount: unratedHotels.length,
      ratedCount: ratedHotels.length,
    });
  } catch (error) {
    console.error("Error fetching user hotels:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm hàm kiểm tra đánh giá
const checkRating = async (req: any, res: any) => {
  try {
    const { hotelId, bookingId } = req.params;
    const userId = req.body.user?.id;

    // Kiểm tra xem người dùng đã đánh giá khách sạn này chưa
    const existingRating = await Rating.findOne({
      where: {
        hotel_id: hotelId,
        booking_hotel_id: bookingId,
        user_id: userId,
      },
    });

    return res.status(200).json({
      hasRated: !!existingRating,
      rating: existingRating,
    });
  } catch (error) {
    console.error("Error checking rating:", error);
    return res.status(500).json({
      message: "Lỗi server khi kiểm tra đánh giá",
    });
  }
};

// Xuất hàm mới cùng với các hàm hiện có
export {
  createRating,
  getHotelRatings,
  getUnratedHotels,
  getHotelOwnerRatings,
  hideRating,
  deleteRating,
  getRatedHotels,
  getAllUserHotels,
  checkRating, // Thêm hàm mới vào exports
};
