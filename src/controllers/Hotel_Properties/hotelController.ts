import { Request, Response } from "express";
import { BookingDetail, Hotel, Room, RoomPrice } from "../../models/index";
import path from "path";
import { Op, fn, literal } from "sequelize";
import sequelize from "sequelize/types/sequelize";

const create = async (req: Request, res: Response) => {
  const payload = req.body;
  try {
    const hotel = await Hotel.create(payload);
    res.status(200).json(hotel);
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
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
const findNearestHotels = async (req: Request, res: Response) => {
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

// lấy khách sạn theo id
const getHotelById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const hotel = await Hotel.findByPk(id);
  res.status(200).json(hotel);
};

export {
  create,
  getHotelRegisters,
  createImage,
  getImageHotel,
  findNearestHotels,
  getHotelById,
};
