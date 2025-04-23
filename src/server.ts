import app from "./app";
import http from "http";
import dotenv from "dotenv";
// Tải file .env
dotenv.config();
const PORT = process.env.PORT;

//chạy một server riêng để tích hợp WebSocket.
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
