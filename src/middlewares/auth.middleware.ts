import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
// Tải file .env
dotenv.config();
interface User {
  id: number;
  firstname?: string | null;
  lastname?: string | null;
  phonenumber?: string | null;
  email?: string | null;
  password?: string | null;
  provider?: string | null;
  provider_id?: string | null;
  image_url?: string | null;
  country_code?: string | null;
  email_verified?: false | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  id_user?: number | null;
  role_name?: string | null;
}
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.split(" ")[1]; //lấy token từ header
  if (!token) {
    res
      .status(401)
      .json({ message: "Truy cập bị từ chối. Không cung cấp mã thông báo." });
    return;
  }
  try {
    const jwtsecret = process.env.SECRET_KEY!;
    const verified = jwt.verify(token, jwtsecret) as User;
    req.body.user = verified;
    next();
  } catch (err) {
    res
      .status(403)
      .json({ message: "Mã thông báo không hợp lệ hoặc đã hết hạn." });
    return;
  }
};

const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.user || !roles.includes(req.body.user?.role_name)) {
      res
        .status(403)
        .json({ message: "Bạn không có quyền truy cập tài nguyên này." });
      return;
    }
    // Xóa user sau khi kiểm tra
    delete req.body.user;
    next();
  };
};
export { verifyToken, checkRole };
