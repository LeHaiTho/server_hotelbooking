import { User } from "../../models/index";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JWT_SECRET } from "../../config/constants";
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
