import { Request, Response } from "express";
import { Room, RoomPrice } from "../../models/index";
import { Sequelize } from "sequelize";
// Lấy các ngày hiện tại thông qua timestamp
function getTimestampsInRange(startDate: any, endDate: any) {
  let start = new Date(startDate); // Ngày bắt đầu
  let end = new Date(endDate); // Ngày kết thúc

  let dates: string[] = [];

  while (start <= end) {
    dates.push(start.toISOString().split("T")[0]);
    start.setDate(start.getDate() + 1); // Tăng ngày lên 1
  }

  return dates;
}
//Tạo phòng mới
const create = async (req: Request, res: Response) => {
  const { ngaybatdau, ngayketthuc, status, price, room_id } = req.body;

  try {
    const ngays = getTimestampsInRange(ngaybatdau, ngayketthuc);
    const roommprice = await RoomPrice.findAll({
      where: { room_id },
      attributes: ["ngays"],
      raw: true,
    });
    // Trả về mảng chứa tất cả giá trị của 'ngays'
    const ngaysArray = roommprice.map(
      (item) => item.ngays?.toISOString().split("T")[0]
    );

    //nếu ngày đã tồn tại thì cập nhật lại ngày đó với giá khác
    for (let item of ngays) {
      if (ngaysArray.includes(item)) {
        //cập nhật lại ngày muốn sửa giá
        await RoomPrice.update(
          { price, status },
          { where: { room_id, ngays: new Date(item) } }
        );
      } else {
        //thêm ngày mới với giá mới
        await RoomPrice.create({ room_id, ngays: item, price });
      }
    }
    res.status(200).json(roommprice);
    return;
  } catch (err) {
    res.status(500).json({ message: err });
    return;
  }
};
// const getbyTyperoom = async (req: any, res: any) => {
//   try {
//     const { idhotel } = req.params;
//     const rooms = await Room.findAll({
//       where: { id_hotel: idhotel },
//       raw: true,
//     });
//     const typeroom = rooms.map((item) => item.loaichonghi);
//     const init = {
//       id: 1,
//       name: "Phòng đơn",
//       price: 1000000,
//       status: true,
//     };
//     res.status(200).json(typeroom);
//     return;
//   } catch (err) {
//     console.log("err", err);
//     res.status(500).json({ message: err });
//     return;
//   }
// };
const getbyTyperoom = async (req: Request, res: Response) => {
  const { idhotel } = req.params;

  try {
    const rooms = await Room.findAll({
      where: { id_hotel: idhotel },
      attributes: ["id", "loaichonghi"],
      raw: true,
    });

    // Nhóm danh sách id theo loaichonghi
    const grouped = rooms.reduce((acc, room) => {
      const type = room.loaichonghi;
      if (type) {
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(room.id);
      }
      return acc;
    }, {} as Record<string, number[]>);

    // Chuyển object thành array
    const result = Object.entries(grouped).map(([loaichonghi, ids]) => ({
      loaichonghi,
      ids,
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export { create, getbyTyperoom };
