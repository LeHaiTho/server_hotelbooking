import { Request, Response } from "express";
import {RoomPrice } from "../../models/index";
import { Sequelize } from "sequelize";
// Lấy các ngày hiện tại thông qua timestamp
function getTimestampsInRange(startDate:any, endDate:any) {
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
    const {ngaybatdau, ngayketthuc, status, price, room_id} = req.body;
    
    try{
        const ngays = getTimestampsInRange(ngaybatdau, ngayketthuc);
        const roommprice = await RoomPrice.findAll({
            where: {room_id},
            attributes:["ngays"],
            raw: true});
        // Trả về mảng chứa tất cả giá trị của 'ngays'
        const ngaysArray = roommprice.map(item => item.ngays?.toISOString().split("T")[0]);

        //nếu ngày đã tồn tại thì cập nhật lại ngày đó với giá khác
        for(let item of ngays){
            if(ngaysArray.includes(item)){
                //cập nhật lại ngày muốn sửa giá
                await RoomPrice.update({price, status}, {where: {room_id, ngays: new Date(item)}});
            }else{
                //thêm ngày mới với giá mới
                await RoomPrice.create({room_id, ngays: item, price});
            }
        }
        res.status(200).json(roommprice);
        return
    }catch(err){
        res.status(500).json({message: err});
        return;
    }
}
const getbyTyperoom = async (req: Request, res: Response) => {
    try{
        const {room_id} = req.body;
        const roomprice = await RoomPrice.findAll({where: {room_id}, raw: true});
        res.status(200).json(roomprice);
        return;
    }catch(err){
        res.status(500).json({message: err});
        return;
    }
}
export {create, getbyTyperoom}