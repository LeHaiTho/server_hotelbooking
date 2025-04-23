import { Type_Hotel } from "../../models/index";
import { Request, Response } from "express";


const get = async (req: Request, res: Response) => {
    try{
        const typehotel = await Type_Hotel.findAll({raw: true});
        res.status(200).json(typehotel);
    }catch(e){
        res.status(500).json({message: e});
        return;
    }
}

export {get}