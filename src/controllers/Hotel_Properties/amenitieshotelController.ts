import { Request, Response } from "express";
import { Amenities_Hotel } from "../../models/index";

const get = async (req: Request, res: Response) => {
  try {
    const amenitieshotel = await Amenities_Hotel.findAll({ raw: true });
    res.status(200).json(amenitieshotel);
  } catch (e) {
    res.status(500).json({ message: e });
    return;
  }
};
const getAmenities = async (req: any, res: any) => {
  try {
    const amenitieshotel = await Amenities_Hotel.findAll({ raw: true });
    res.status(200).json(amenitieshotel);
  } catch (e) {
    res.status(500).json({ message: e });
  }
};
export { get, getAmenities };
