import { Request, Response } from "express";
import {
  BookingDetail,
  Hotel,
  Room,
  Promotion,
  RoomPriceAdjustment,
  Rating,
  Type_Hotel,
  User,
  TypeRoom,
  BookingHotel,
} from "../../models/index";
import path from "path";
import { Op, fn, literal } from "sequelize";
import moment from "moment";
import sequelize from "../../config/sequelize";

const removeVietnameseTones = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const normalizeAddress = (address: string) => {
  // Chuyển đổi thành chữ thường và loại bỏ dấu
  const noDiacritic = removeVietnameseTones(address);
  const normalized = noDiacritic
    .toLowerCase()
    // Chuẩn hóa các từ khóa địa lý phổ biến
    .replace(/\b(tp|t\.p|tp\.|thanh pho)\b/gi, "thanhpho")
    .replace(/\b(t|t\.|tinh)\b/gi, "tinh")
    .replace(/\b(q|q\.|quan)\b/gi, "quan")
    .replace(/\b(p|p\.|phuong)\b/gi, "phuong")
    .replace(/\b(h|h\.|huyen)\b/gi, "huyen")
    .replace(/\b(tx|tx\.|thi xa)\b/gi, "thixa")
    .replace(/\s+/g, " ") // Loại bỏ khoảng trắng thừa
    .trim();

  return normalized;
};

// Hàm mới để trích xuất các thành phần địa lý quan trọng từ địa chỉ
const extractLocationComponents = (address: string) => {
  const normalized = normalizeAddress(address);

  // Tách địa chỉ thành các phần theo dấu phẩy
  const parts = normalized.split(",").map((part) => part.trim());

  // Mảng lưu các thành phần địa lý quan trọng
  const components = [];

  // Xử lý từng phần của địa chỉ
  for (const part of parts) {
    // Tìm thành phố/tỉnh
    if (part.includes("thanhpho") || part.includes("tinh")) {
      // Trích xuất tên địa điểm (bỏ từ khóa thanhpho/tinh)
      const locationName = part
        .replace(/thanhpho\s+/i, "")
        .replace(/tinh\s+/i, "")
        .trim();

      if (locationName) {
        components.push(locationName);
      }
    } else {
      // Thêm phần còn lại vào components nếu có ý nghĩa
      if (part.length > 2) {
        components.push(part);
      }
    }
  }

  // Nếu không tìm thấy thành phần nào, sử dụng toàn bộ địa chỉ đã chuẩn hóa
  if (components.length === 0) {
    // Tách thành các từ và lọc bỏ các từ quá ngắn
    const words = normalized.split(" ").filter((word) => word.length > 2);
    components.push(...words);
  }

  return components;
};

const create = async (req: Request, res: Response) => {
  const payload = req.body;

  try {
    // Gán thêm address_no_diacritic nếu có address
    if (payload.address) {
      payload.address_no_diacritic = normalizeAddress(payload.address);
    }

    const hotel = await Hotel.create(payload);
    res.status(200).json(hotel);
  } catch (err: any) {
    console.error("Error creating hotel:", err);
    res
      .status(500)
      .json({ message: err.message || "Lỗi server khi tạo khách sạn" });
  }
};

//Lấy khách sạn chưa hoàn thành toàn bộ thủ tục đăng ký
const getHotelRegisters = async (req: Request, res: Response) => {
  try {
    const { id_user } = req.params;
    const { isRegister } = req.body;
    const hotel = await Hotel.findAll({
      where: { isRegister: isRegister, id_user: id_user },
      raw: true,
    });
    res.status(200).json(hotel);
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};

//Thêm hình ảnh khách sạnh
const createImage = async (req: Request, res: Response) => {
  const { idhotel } = req.params;
  try {
    // Tạo một mảng để lưu tên tất cả file đã upload
    if (Array.isArray(req.files)) {
      const fileNames = req.files.map((file) => file.filename);
      await Hotel.update(
        {
          images: fileNames.join(","),
        },
        { where: { id: idhotel } }
      );

      res.status(200).json({ message: "Cập nhật ảnh thành công" });
      return;
    }
    res.status(201).json({ message: "Cập nhật ảnh thất bại" });
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};

//lấy thumnbail khách sạn
const getImageHotel = (req: Request, res: Response) => {
  res.set("cross-origin-resource-policy", "cross-origin"); //cho phép từ các nguồn khác
  const { idhotel, thumbnail } = req.params;
  const filepath = path.join(
    __dirname,
    `../../../storage/hotel/${idhotel}/${thumbnail}`
  );
  res.sendFile(filepath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      return res.status(404).send("File not found");
    }
  });
};

//Tìm kiếm khách sạn gần nhất
const findNearestHotels = async (req: any, res: any) => {
  const {
    location,
    longitude,
    latitude,
    checkInDate,
    checkOutDate,
    adults,
    children,
    rooms,
  } = req.query;

  const lat = Number(latitude);
  const lon = Number(longitude);
  const minPeoplePerRoom = Math.ceil(Number(adults) / Number(rooms));

  const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  try {
    const hotels = await Hotel.findAll({
      include: [
        {
          model: Room,
          where: {
            soluongkhach: {
              [Op.gte]: minPeoplePerRoom,
            },
          },
          attributes: ["id", "sotien", "soluongkhach"],
          include: [
            {
              model: BookingDetail,
              as: "BookingDetails", // Đảm bảo khớp alias
              where: {
                [Op.or]: [
                  {
                    checkin_date: { [Op.between]: [checkInDate, checkOutDate] },
                  },
                  {
                    checkout_date: {
                      [Op.between]: [checkInDate, checkOutDate],
                    },
                  },
                  {
                    [Op.and]: [
                      { checkin_date: { [Op.lte]: checkInDate } },
                      { checkout_date: { [Op.gte]: checkOutDate } },
                    ],
                  },
                ],
                status: { [Op.ne]: "CANCELLED" },
              },
              required: false,
            },
          ],
          required: true,
        },
      ],
    });

    const plainHotels = hotels.map((hotel) => hotel.get({ plain: true }));

    // lọc ra các khách sạn có phòng trống
    const hotelsWithAvailableRooms = plainHotels?.map((hotel) => {
      const availableRooms = hotel.Rooms?.filter((room: any) => {
        return room.BookingDetails.length === 0;
      });
      return {
        ...hotel,
        availableRooms,
        availableRoomsLength: availableRooms.length >= Number(rooms),
      };
    });

    // lấy ra các khách sạn có phòng trống và số phòng trống bằng với rooms
    const hotelsWithAvailableRoomsAndRooms = hotelsWithAvailableRooms?.filter(
      (hotel) => hotel.availableRoomsLength
    );
    const hotelsWithDistance = hotelsWithAvailableRoomsAndRooms?.map(
      (hotel) => {
        const d = distance(
          lat,
          lon,
          Number(hotel.latitude),
          Number(hotel.longitude)
        );

        return { ...hotel, distance: d };
      }
    );
    const sortedHotels = hotelsWithDistance.sort(
      (a, b) => a.distance - b.distance
    );

    const nearestHotels = sortedHotels.slice(0, 5);
    res.status(200).json({ nearestHotels, total: sortedHotels?.length });
  } catch (error) {
    console.log("Lỗi khi tìm kiếm khách sạn gần nhất", error);
    res.status(500).json({ message: error });
    return;
  }
};

// Hàm tính giá ban đầu và giá cuối cùng cho phòng, dựa trên số ngày thuê
const calculateFinalPrice = (
  basePrice: number,
  adjustments: any[],
  promotions: any[],
  checkInDate: string,
  checkOutDate: string
): { initial_price: number; final_price: number } => {
  const checkIn = moment(checkInDate);
  const checkOut = moment(checkOutDate);

  // Tính số ngày thuê
  const days = checkOut.diff(checkIn, "days");
  const initialPrice = basePrice * days;

  let totalPrice = 0;

  // Tên thứ bằng tiếng Việt
  const daysOfWeek = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];

  // Lặp qua từng ngày từ checkIn đến checkOut (không bao gồm checkOut)
  for (let m = checkIn.clone(); m.isBefore(checkOut); m.add(1, "days")) {
    let dailyPrice = basePrice;
    const currentDay = m.day(); // 0 = Chủ nhật, 1 = Thứ 2, ...

    // Lọc RoomPriceAdjustments áp dụng cho ngày hiện tại
    const applicableAdjustments = adjustments
      .filter((adj) => {
        const start = adj.start_date ? moment(adj.start_date) : null;
        const end = adj.end_date ? moment(adj.end_date) : null;
        return (
          (start === null || m.isSameOrAfter(start)) &&
          (end === null || m.isSameOrBefore(end)) &&
          adj.apply_to_days.includes(currentDay)
        );
      })
      .sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));

    if (applicableAdjustments.length > 0) {
      const latestAdjustment = applicableAdjustments[0];
      if (latestAdjustment.adjustment_type === "PERCENTAGE") {
        dailyPrice *= 1 + Number(latestAdjustment.adjustment_value) / 100;
      } else if (latestAdjustment.adjustment_type === "FIXED") {
        dailyPrice += Number(latestAdjustment.adjustment_value);
      }
    } else {
      // Log cho ngày không áp dụng điều chỉnh
      console.log(
        `Không áp dụng ngày thứ: ${daysOfWeek[currentDay]} (${m.format(
          "YYYY-MM-DD"
        )})`
      );
    }

    // Lọc Promotions áp dụng cho ngày hiện tại
    const applicablePromotions = promotions
      .filter((promo) => {
        const start = promo.start_date ? moment(promo.start_date) : null;
        const end = promo.end_date ? moment(promo.end_date) : null;
        return (
          promo.is_active &&
          (start === null || m.isSameOrAfter(start)) &&
          (end === null || m.isSameOrBefore(end))
        );
      })
      .sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));

    // Áp dụng tất cả khuyến mãi
    for (const promo of applicablePromotions) {
      if (promo.discount_type === "PERCENTAGE") {
        dailyPrice *= 1 - Number(promo.discount_value) / 100;
      } else if (promo.discount_type === "FIXED") {
        dailyPrice -= Number(promo.discount_value);
      }
    }

    // Đảm bảo giá ngày không âm và làm tròn
    totalPrice += Math.max(0, Math.round(dailyPrice));
  }

  return { initial_price: initialPrice, final_price: totalPrice };
};

const findHotelsByAddress = async (req: any, res: any) => {
  const {
    address,
    latitude,
    longitude,
    checkInDate,
    checkOutDate,
    adults,
    children,
    rooms,
    filters,
  } = req.query;

  // Kiểm tra xem có tọa độ hay không để quyết định tìm theo địa chỉ hay tọa độ
  const isLocationSearch = latitude && longitude;

  if (!checkInDate || !checkOutDate) {
    return res
      .status(400)
      .json({ message: "Ngày check-in và check-out là bắt buộc" });
  }

  const checkIn = moment(checkInDate);
  const checkOut = moment(checkOutDate);
  if (checkIn.isAfter(checkOut)) {
    return res
      .status(400)
      .json({ message: "checkInDate phải trước hoặc bằng checkOutDate" });
  }

  const minPeoplePerRoom = Math.ceil(Number(adults) / Number(rooms));

  // Xử lý filters nếu có
  let parsedFilters = {};
  if (filters) {
    try {
      parsedFilters = JSON.parse(filters);
      console.log("Parsed filters:", parsedFilters);
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Định dạng filters không hợp lệ" });
    }
  }

  const { priceRange, amenities, minRating } = parsedFilters as {
    priceRange: number[];
    amenities: string[];
    minRating: number;
  };

  try {
    let whereCondition = {};

    // Nếu tìm kiếm theo tọa độ
    if (isLocationSearch) {
      // Không cần điều kiện where đặc biệt, sẽ lọc theo khoảng cách sau
    }
    // Nếu tìm kiếm theo địa chỉ
    else if (address) {
      console.log("Searching by address:", address);

      // Trích xuất các thành phần địa lý quan trọng
      const locationComponents = extractLocationComponents(address);
      console.log("Location components:", locationComponents);

      if (locationComponents.length > 0) {
        // Tạo điều kiện tìm kiếm dựa trên các thành phần địa lý
        const orConditions = [];

        // Tìm kiếm trong city
        orConditions.push(
          ...locationComponents.map((component) => ({
            city: { [Op.iLike]: `%${component}%` },
          }))
        );

        // Tìm kiếm trong address_no_diacritic
        orConditions.push(
          ...locationComponents.map((component) => ({
            address_no_diacritic: { [Op.iLike]: `%${component}%` },
          }))
        );

        whereCondition = {
          [Op.or]: orConditions,
        };
      } else {
        // Fallback: sử dụng địa chỉ đã chuẩn hóa
        const formattedAddress = normalizeAddress(address);
        whereCondition = {
          address_no_diacritic: { [Op.iLike]: `%${formattedAddress}%` },
        };
      }

      console.log("Final where condition:", JSON.stringify(whereCondition));
    } else {
      return res
        .status(400)
        .json({ message: "Địa chỉ hoặc tọa độ là bắt buộc" });
    }

    // Điều kiện lọc đánh giá
    let ratingCondition = {};
    if (minRating && Number(minRating) > 0) {
      ratingCondition = {
        rate: {
          [Op.gte]: Number(minRating),
        },
      };
    }

    // Kết hợp các điều kiện
    whereCondition = {
      ...whereCondition,
      ...ratingCondition,
    };

    // Tìm tất cả khách sạn theo điều kiện cơ bản
    const hotels = await Hotel.findAll({
      where: whereCondition,
      include: [
        {
          model: Room,
          where: {
            soluongkhach: {
              [Op.gte]: minPeoplePerRoom,
            },
          },
          attributes: ["id", "sotien", "soluongkhach"],
          include: [
            {
              model: Promotion,
              as: "Promotions",
              where: {
                is_active: true,
                [Op.or]: [
                  { start_date: null },
                  { start_date: { [Op.lte]: checkInDate } },
                ],
              },
              required: false,
            },
            {
              model: RoomPriceAdjustment,
              as: "RoomPriceAdjustments",
              where: {
                [Op.or]: [
                  { start_date: null },
                  { start_date: { [Op.lte]: checkInDate } },
                ],
              },
              required: false,
            },
            {
              model: BookingDetail,
              as: "BookingDetails",
              where: {
                [Op.or]: [
                  {
                    checkin_date: { [Op.between]: [checkInDate, checkOutDate] },
                  },
                  {
                    checkout_date: {
                      [Op.between]: [checkInDate, checkOutDate],
                    },
                  },
                  {
                    [Op.and]: [
                      { checkin_date: { [Op.lte]: checkInDate } },
                      { checkout_date: { [Op.gte]: checkOutDate } },
                    ],
                  },
                ],
                status: { [Op.ne]: "CANCELLED" },
              },
              required: false,
            },
          ],
          required: true,
        },
        {
          model: Rating,
          required: false,
          attributes: [
            "overall",
            "staff",
            "facility",
            "comfortable",
            "clean",
            "money",
            "location",
          ],
        },
      ],
    });

    const plainHotels = hotels.map((hotel) => hotel.get({ plain: true }));

    // Xử lý dữ liệu khách sạn
    let processedHotels = plainHotels.map((hotel) => {
      // Xử lý phòng có sẵn và tính giá
      const availableRooms = hotel.Rooms?.filter(
        (room: any) =>
          !room.BookingDetails ||
          room.BookingDetails.length === 0 ||
          room.BookingDetails.every(
            (booking: any) =>
              booking.status === "CANCELLED" ||
              new Date(booking.checkout_date) <= new Date(checkInDate) ||
              new Date(booking.checkin_date) >= new Date(checkOutDate)
          )
      );

      const roomsWithFinalPrice = availableRooms?.map((room: any) => {
        const { initial_price, final_price } = calculateFinalPrice(
          room.sotien,
          room.RoomPriceAdjustments || [],
          room.Promotions || [],
          checkInDate,
          checkOutDate
        );

        return {
          ...room,
          initial_price,
          final_price,
        };
      });

      // Sắp xếp phòng theo giá từ thấp đến cao
      const sortedAvailableRooms = roomsWithFinalPrice?.sort(
        (a: any, b: any) => a.final_price - b.final_price
      );

      // Tính toán điểm đánh giá trung bình
      let averageOverall = 0;
      let normalizedStaff = 0;
      let normalizedFacility = 0;
      let normalizedComfortable = 0;
      let normalizedClean = 0;
      let normalizedMoney = 0;
      let normalizedLocation = 0;
      let normalizedAverage = 0;
      let totalRatings = 0;

      if (hotel.Ratings && hotel.Ratings.length > 0) {
        totalRatings = hotel.Ratings.length;

        // Tính tổng các đánh giá
        const sums = hotel.Ratings.reduce(
          (acc: any, rating: any) => {
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

        // Tính trung bình
        averageOverall = sums.overall / totalRatings;
        const averageStaff = sums.staff / totalRatings;
        const averageFacility = sums.facility / totalRatings;
        const averageComfortable = sums.comfortable / totalRatings;
        const averageClean = sums.clean / totalRatings;
        const averageMoney = sums.money / totalRatings;
        const averageLocation = sums.location / totalRatings;

        // Chuẩn hóa về thang điểm 10
        normalizedStaff = (averageStaff / 4) * 10;
        normalizedFacility = (averageFacility / 4) * 10;
        normalizedComfortable = (averageComfortable / 4) * 10;
        normalizedClean = (averageClean / 4) * 10;
        normalizedMoney = (averageMoney / 4) * 10;
        normalizedLocation = (averageLocation / 4) * 10;

        // Tính điểm trung bình tổng thể
        normalizedAverage =
          (averageOverall +
            normalizedStaff +
            normalizedFacility +
            normalizedComfortable +
            normalizedClean +
            normalizedMoney +
            normalizedLocation) /
          7;
      }

      return {
        ...hotel,
        Rooms: roomsWithFinalPrice,
        availableRooms: sortedAvailableRooms,
        availableRoomsLength: sortedAvailableRooms.length >= Number(rooms),
        ratingStats: {
          total: totalRatings,
          averageOverall: parseFloat(averageOverall.toFixed(1)),
          normalizedStaff: parseFloat(normalizedStaff.toFixed(1)),
          normalizedFacility: parseFloat(normalizedFacility.toFixed(1)),
          normalizedComfortable: parseFloat(normalizedComfortable.toFixed(1)),
          normalizedClean: parseFloat(normalizedClean.toFixed(1)),
          normalizedMoney: parseFloat(normalizedMoney.toFixed(1)),
          normalizedLocation: parseFloat(normalizedLocation.toFixed(1)),
          normalizedAverage: parseFloat(normalizedAverage.toFixed(1)),
        },
      };
    });

    // Lọc khách sạn có đủ phòng
    let filteredHotels = processedHotels.filter(
      (hotel) => hotel.availableRoomsLength
    );

    // Nếu tìm kiếm theo tọa độ, tính khoảng cách và sắp xếp
    if (isLocationSearch) {
      const lat = Number(latitude);
      const lon = Number(longitude);

      // Hàm tính khoảng cách
      const distance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
      };

      // Tính khoảng cách cho mỗi khách sạn
      filteredHotels = filteredHotels.map((hotel) => {
        const d = distance(
          lat,
          lon,
          Number(hotel.latitude),
          Number(hotel.longitude)
        );
        return { ...hotel, distance: d };
      });

      // Sắp xếp theo khoảng cách
      filteredHotels = filteredHotels.sort((a, b) => a.distance - b.distance);
    }

    // Lọc theo khoảng giá nếu có
    if (priceRange && Array.isArray(priceRange) && priceRange.length === 2) {
      filteredHotels = filteredHotels.filter((hotel) => {
        const cheapestRoom = hotel.availableRooms?.reduce(
          (prev: any, current: any) =>
            prev.final_price < current.final_price ? prev : current,
          { final_price: Infinity }
        );

        return (
          cheapestRoom &&
          cheapestRoom.final_price >= priceRange[0] &&
          cheapestRoom.final_price <= priceRange[1]
        );
      });
    }

    // Lọc theo tiện nghi nếu có
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      console.log("Filtering by amenities:", amenities);

      filteredHotels = filteredHotels.filter((hotel) => {
        // Nếu khách sạn không có tiện nghi, loại bỏ
        if (!hotel.arrAmenities) {
          console.log("Hotel has no amenities:", hotel.id, hotel.name);
          return false;
        }

        // Chuyển đổi chuỗi tiện nghi thành mảng và chuẩn hóa
        const hotelAmenities = hotel.arrAmenities
          .split(",")
          .map((item: any) => item.trim().toLowerCase());

        console.log("Hotel ID:", hotel.id, "Hotel Name:", hotel.name);
        console.log("Hotel amenities:", hotelAmenities);

        // Lọc ra các tiện nghi là chuỗi và chuẩn hóa
        const selectedAmenityNames = amenities
          .filter((item: any) => typeof item === "string")
          .map((item: any) => item.trim().toLowerCase());

        console.log("Selected amenities:", selectedAmenityNames);

        // Kiểm tra từng tiện nghi được chọn
        for (const amenity of selectedAmenityNames) {
          let found = false;

          // Tìm tiện nghi trong danh sách tiện nghi của khách sạn
          for (const hotelAmenity of hotelAmenities) {
            // So sánh chính xác hoặc kiểm tra xem tiện nghi của khách sạn có chứa tiện nghi được chọn không
            if (hotelAmenity === amenity || hotelAmenity.includes(amenity)) {
              found = true;
              break;
            }
          }

          // Nếu không tìm thấy tiện nghi nào khớp, loại bỏ khách sạn này
          if (!found) {
            console.log(`Amenity "${amenity}" not found in hotel ${hotel.id}`);
            return false;
          }
        }

        console.log(`Hotel ${hotel.id} matches all selected amenities`);
        return true;
      });
    }

    // Lọc theo đánh giá tối thiểu nếu có
    if (minRating && Number(minRating) > 0) {
      console.log("Filtering by minimum rating:", minRating);

      // Chuyển đổi giá trị lọc từ thang điểm 0-10 sang thang điểm 0-4
      const convertedMinRating = Number(minRating);
      console.log("convertedMinRating", convertedMinRating);
      console.log("minRating", minRating);

      filteredHotels = filteredHotels.filter((hotel) => {
        // Kiểm tra xem hotel.ratingStats có tồn tại không
        if (!hotel.ratingStats) {
          console.log(`Hotel ${hotel.id} has no ratingStats`);
          return false;
        }

        // Sử dụng điểm đánh giá trung bình normalizedAverage (thang điểm 0-10)
        const rating = hotel.ratingStats.normalizedAverage;
        console.log(`Hotel ${hotel.id} normalizedAverage:`, rating);

        // Kiểm tra xem khách sạn có đánh giá không
        if (!rating || isNaN(rating)) {
          console.log(`Hotel ${hotel.id} has no valid rating`);
          return false;
        }

        // So sánh với điểm tối thiểu
        const result = rating >= Number(minRating);
        console.log(
          `Hotel ${hotel.id} rating: ${rating}, minimum: ${minRating}, passes: ${result}`
        );
        return result;
      });

      console.log(
        `After rating filter: ${filteredHotels.length} hotels remaining`
      );
    }

    res.status(200).json({
      hotels: filteredHotels,
      total: filteredHotels.length,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm khách sạn:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm khách sạn" });
  }
};

const getHotelById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const hotel = await Hotel.findByPk(id);
  res.status(200).json(hotel);
};

// Thêm hàm mới để lấy khách sạn dựa trên lịch sử tìm kiếm
const findHotelsByRecentSearches = async (req: any, res: any) => {
  try {
    const { recentSearches } = req.body;
    if (
      !recentSearches ||
      !Array.isArray(recentSearches) ||
      recentSearches.length === 0
    ) {
      return res
        .status(200)
        .json({ hotels: [], message: "Không có lịch sử tìm kiếm" });
    }

    console.log("recentSearches", recentSearches);
    // Lấy tối đa 5 địa điểm tìm kiếm gần đây
    // const recentLocations = recentSearches
    //   .slice(0, 5)
    //   .map((search) => normalizeAddress(search.location));

    // // Tạo điều kiện tìm kiếm
    // const addressConditions = recentLocations.map((location) => {
    //   const keywords = location.split(" ");
    //   return {
    //     [Op.or]: keywords.map((keyword) => ({
    //       address_no_diacritic: {
    //         [Op.iLike]: `%${keyword}%`,
    //       },
    //     })),
    //   };
    // });

    // // Tìm khách sạn dựa trên các địa điểm
    // const hotels = await Hotel.findAll({
    //   where: {
    //     [Op.or]: addressConditions,
    //   },
    //   include: [
    //     {
    //       model: Room,
    //       attributes: ["id", "sotien", "soluongkhach"],
    //       include: [
    //         {
    //           model: Promotion,
    //           as: "Promotions",
    //           where: {
    //             is_active: true,
    //           },
    //           required: false,
    //         },
    //         {
    //           model: RoomPriceAdjustment,
    //           as: "RoomPriceAdjustments",
    //           required: false,
    //         },
    //       ],
    //       required: false,
    //     },
    //   ],
    //   limit: 10, // Giới hạn 10 khách sạn
    // });

    // // Xử lý dữ liệu trả về
    // const plainHotels = hotels.map((hotel) => hotel.get({ plain: true }));

    // // Tính giá phòng cho mỗi khách sạn
    // const hotelsWithPrices = plainHotels.map((hotel) => {
    //   const roomsWithPrices = hotel.Rooms?.map((room: any) => {
    //     // Lấy ngày từ tìm kiếm gần đây nhất
    //     const latestSearch = recentSearches[0];
    //     const { initial_price, final_price } = calculateFinalPrice(
    //       room.sotien,
    //       room.RoomPriceAdjustments || [],
    //       room.Promotions || [],
    //       latestSearch.checkInDate,
    //       latestSearch.checkOutDate
    //     );

    //     return {
    //       ...room,
    //       initial_price,
    //       final_price,
    //     };
    //   });

    //   return {
    //     ...hotel,
    //     Rooms: roomsWithPrices,
    //   };
    // });

    // res.status(200).json({
    //   hotels: hotelsWithPrices,
    //   total: hotelsWithPrices.length,
    // });
  } catch (error) {
    console.error("Lỗi khi tìm khách sạn theo lịch sử tìm kiếm:", error);
    res.status(500).json({ message: "Lỗi server khi tìm khách sạn" });
  }
};

// Thêm hàm mới để lọc khách sạn theo nhiều điều kiện
const filterHotels = async (req: any, res: any) => {
  try {
    const { searchCondition, filters } = req.body;

    if (!searchCondition) {
      return res.status(400).json({ message: "Thiếu thông tin tìm kiếm" });
    }

    const { location, checkInDate, checkOutDate, capacity, rooms } =
      searchCondition;
    const { priceRange, amenities, minRating } = filters || {};
    // normalize;
    // Xác định điều kiện tìm kiếm cơ bản
    let addressCondition = {};
    if (location) {
      if (location.address) {
        const formattedAddress = normalizeAddress(location.address);
        const addressKeywords = formattedAddress.split(" ");

        if (addressKeywords.length <= 2) {
          addressCondition = {
            [Op.or]: addressKeywords.map((keyword) => ({
              address_no_diacritic: {
                [Op.iLike]: `%${keyword}%`,
              },
            })),
          };
        } else {
          addressCondition = {
            address_no_diacritic: {
              [Op.iLike]: {
                [Op.any]: addressKeywords.map((keyword) => `%${keyword}%`),
              },
            },
          };
        }
      } else if (location.latitude && location.longitude) {
        // Xử lý tìm kiếm theo tọa độ nếu cần
      }
    }

    // Xác định điều kiện lọc theo tiện nghi
    let amenitiesCondition = {};
    if (amenities && amenities.length > 0) {
      amenitiesCondition = {
        arrAmenities: {
          [Op.overlap]: amenities,
        },
      };
    }

    // Xác định điều kiện lọc theo đánh giá
    // let ratingCondition = {};
    // if (minRating && minRating > 0) {
    //   ratingCondition = {
    //     rate: {
    //       [Op.gte]: minRating,
    //     },
    //   };
    // }

    // Kết hợp các điều kiện
    const whereCondition = {
      ...addressCondition,
      ...amenitiesCondition,
      // ...ratingCondition,
    };

    const minPeoplePerRoom = Math.ceil(
      Number(capacity?.adults || 2) / Number(rooms || 1)
    );

    // Tìm khách sạn theo điều kiện
    const hotels = await Hotel.findAll({
      where: whereCondition,
      include: [
        {
          model: Room,
          where: {
            soluongkhach: {
              [Op.gte]: minPeoplePerRoom,
            },
          },
          attributes: ["id", "sotien", "soluongkhach"],
          include: [
            {
              model: Promotion,
              as: "Promotions",
              where: {
                is_active: true,
                [Op.or]: [
                  { start_date: null },
                  { start_date: { [Op.lte]: checkInDate } },
                ],
              },
              required: false,
            },
            {
              model: RoomPriceAdjustment,
              as: "RoomPriceAdjustments",
              where: {
                [Op.or]: [
                  { start_date: null },
                  { start_date: { [Op.lte]: checkInDate } },
                ],
              },
              required: false,
            },
            {
              model: BookingDetail,
              as: "BookingDetails",
              where: {
                [Op.or]: [
                  {
                    checkin_date: { [Op.between]: [checkInDate, checkOutDate] },
                  },
                  {
                    checkout_date: {
                      [Op.between]: [checkInDate, checkOutDate],
                    },
                  },
                  {
                    [Op.and]: [
                      { checkin_date: { [Op.lte]: checkInDate } },
                      { checkout_date: { [Op.gte]: checkOutDate } },
                    ],
                  },
                ],
                status: { [Op.ne]: "CANCELLED" },
              },
              required: false,
            },
          ],
          required: true,
        },
      ],
    });

    const plainHotels = hotels.map((hotel) => hotel.get({ plain: true }));

    // Tính giá phòng và lọc theo khoảng giá
    const hotelsWithPrices = plainHotels.map((hotel) => {
      const roomsWithPrices = hotel.Rooms?.map((room: any) => {
        const { initial_price, final_price } = calculateFinalPrice(
          room.sotien,
          room.RoomPriceAdjustments || [],
          room.Promotions || [],
          checkInDate,
          checkOutDate
        );

        return {
          ...room,
          initial_price,
          final_price,
        };
      });

      return {
        ...hotel,
        Rooms: roomsWithPrices,
      };
    });

    // Lọc theo khoảng giá nếu có
    let filteredHotels = hotelsWithPrices;
    if (priceRange && priceRange.length === 2) {
      filteredHotels = filteredHotels.filter((hotel) => {
        // Tìm phòng có giá thấp nhất
        const cheapestRoom = hotel.Rooms?.reduce(
          (prev: any, current: any) =>
            prev.final_price < current.final_price ? prev : current,
          { final_price: Infinity }
        );

        return (
          cheapestRoom &&
          cheapestRoom.final_price >= priceRange[0] &&
          cheapestRoom.final_price <= priceRange[1]
        );
      });
    }

    res.status(200).json({
      hotels: filteredHotels,
      total: filteredHotels.length,
    });
  } catch (error) {
    console.error("Lỗi khi lọc khách sạn:", error);
    res.status(500).json({ message: "Lỗi server khi lọc khách sạn" });
  }
};

/**
 * Lấy thông tin chi tiết của một khách sạn theo ID
 */
const getHotelDetail = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Lấy thông tin chi tiết khách sạn
    const hotel = await Hotel.findOne({
      where: { id },
      include: [
        {
          model: Type_Hotel,
          attributes: ["id", "name", "description"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "phone", "avatar"],
        },
        {
          model: Room,
          attributes: [
            "id",
            "nameroom",
            "sotien",
            "description",
            "image",
            "status",
            "id_type_room",
            "max_people",
            "quantity",
          ],
          include: [
            {
              model: TypeRoom,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
    });

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Tính toán thống kê về phòng
    const roomStats = await Room.findAll({
      attributes: [
        "id_type_room",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      ],
      where: { id_hotel: id },
      group: ["id_type_room"],
      include: [
        {
          model: TypeRoom,
          attributes: ["name"],
        },
      ],
      raw: true,
      nest: true,
    });

    // Lấy đánh giá trung bình của khách sạn
    const ratings = await Rating.findAll({
      attributes: [
        [sequelize.fn("AVG", sequelize.col("overall")), "avg_overall"],
        [sequelize.fn("AVG", sequelize.col("clean")), "avg_clean"],
        [sequelize.fn("AVG", sequelize.col("service")), "avg_service"],
        [sequelize.fn("AVG", sequelize.col("value")), "avg_value"],
        [sequelize.fn("AVG", sequelize.col("location")), "avg_location"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_ratings"],
      ],
      where: { hotel_id: id },
      raw: true,
    });

    // Lấy số lượng đặt phòng
    const bookingCount = await BookingHotel.count({
      where: { id_hotel: id },
    });

    // Lấy doanh thu
    const revenue =
      (await BookingHotel.sum("total_price", {
        where: {
          id_hotel: id,
          status: "CONFIRMED",
        },
      })) || 0;

    return res.status(200).json({
      hotel,
      roomStats,
      ratings: ratings[0],
      bookingCount,
      revenue,
    });
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// Thêm hàm xóa mềm khách sạn (soft delete)
const softDeleteHotel = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem khách sạn có tồn tại không
    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Cập nhật trạng thái isRegister thành true để ẩn khách sạn
    await Hotel.update({ isRegister: true }, { where: { id } });

    return res.status(200).json({
      message: "Đã ẩn khách sạn thành công",
      id,
    });
  } catch (error) {
    console.error("Error soft deleting hotel:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi ẩn khách sạn", error });
  }
};

// Thêm hàm lấy tất cả khách sạn cho dashboard admin
const getAllHotelsForAdmin = async (req: any, res: any) => {
  try {
    // Lấy tất cả khách sạn, bao gồm cả những khách sạn đã bị ẩn
    const hotels = await Hotel.findAll({
      include: [
        {
          model: Type_Hotel,
          attributes: ["name"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["fullname", "email", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Thêm thông tin về số lượng phòng và đánh giá trung bình

    return res.status(200).json(hotels);
  } catch (error) {
    console.error("Error fetching hotels for admin:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách khách sạn", error });
  }
};

export {
  create,
  getHotelRegisters,
  createImage,
  getImageHotel,
  findNearestHotels,
  getHotelById,
  findHotelsByAddress,
  findHotelsByRecentSearches,
  filterHotels,
  getHotelDetail,
  softDeleteHotel,
  getAllHotelsForAdmin,
};
