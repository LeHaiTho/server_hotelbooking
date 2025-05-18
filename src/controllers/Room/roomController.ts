import { Request, Response } from "express";
import { Room } from "../../models";

// Basic room controller functions
const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.findAll();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error });
  }
};

const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: "Error fetching room", error });
  }
};

export { getRooms, getRoomById };
