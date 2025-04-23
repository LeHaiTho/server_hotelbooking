const AppName = "MNMQ.com";
import dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.SECRET_KEY || "";

export { AppName };
