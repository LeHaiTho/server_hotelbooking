# SERVER CREATE
cấu hình:
- tạo forder server
    + tạo file .gitignore 
    + tạo file README.md
    + tạo forder src
## 0. cấu trúc dự án
project-root/
│
├── src/                    # Thư mục chứa mã nguồn chính
│   ├── config/             # Cấu hình chung (database, môi trường, v.v.)
│   │   └── db.js           # Cấu hình cơ sở dữ liệu
│   │   └── dotenv.js       # Cấu hình biến môi trường
│   │
│   ├── controllers/        # Các controller xử lý logic API
│   │   ├── userController.js
│   │   ├── authController.js
│   │   └── ...
│   │
│   ├── models/             # Định nghĩa các model (Sequelize, Mongoose, v.v.)
│   │   ├── userModel.js
│   │   └── ...
│   │
│   ├── routes/             # Định nghĩa các route
│   │   ├── userRoutes.js
│   │   ├── authRoutes.js
│   │   └── ...
│   │
│   ├── middlewares/        # Các middleware (xác thực, logging, v.v.)
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── ...
│   │
│   ├── utils/              # Các tiện ích dùng chung (helpers, validation, v.v.)
│   │   ├── jwtHelper.js
│   │   ├── validator.js
│   │   └── ...
│   │
│   ├── app.js              # Khởi tạo ứng dụng Express
│   └── server.js           # Điểm vào chính của server
│
├── tests/                  # Thư mục chứa các file test
│   ├── integration/        # Test tích hợp
│   ├── unit/               # Test đơn vị
│   └── ...
│
├── .env                    # Tệp cấu hình biến môi trường
├── .gitignore              # Tệp cấu hình bỏ qua của Git
├── package.json            # Thông tin dự án và danh sách dependencies
└── README.md               # Tài liệu mô tả dự á


## bảng 2 chia chi tiết hơn mô hình mvc
/src
│── /controllers        # Chứa các controller, chia theo module
│   │── /auth           # Xử lý đăng nhập, đăng ký
│   │   ├── auth.controller.js
│   │── /manage         # Các API dành cho quản lý
│   │   ├── user.controller.js
│   │   ├── hotel.controller.js
│   │── /hotel          # API lấy thông tin khách sạn
│   │   ├── hotel.controller.js
│   │   ├── room.controller.js
│   │   ├── amenity.controller.js
│   │── /common         # Các controller dùng chung
│   │   ├── upload.controller.js
│   │   ├── email.controller.js
│
│── /routes             # Chứa các route, chia theo module
│   │── /auth           # Routes cho auth
│   │   ├── auth.routes.js
│   │── /manage         # Routes cho quản lý
│   │   ├── user.routes.js
│   │   ├── hotel.routes.js
│   │── /hotel          # Routes cho khách sạn
│   │   ├── hotel.routes.js
│   │   ├── room.routes.js
│   │   ├── amenity.routes.js
│   │── /common         # Các route dùng chung
│   │   ├── upload.routes.js
│   │   ├── email.routes.js
│
│── /models             # Chứa các model của Sequelize hoặc Mongoose
│── /services           # Xử lý nghiệp vụ, truy vấn DB thay vì xử lý trong controller
│── /middlewares        # Middleware như auth, error handling
│── /utils              # Các function tiện ích
│── app.js              # Khởi tạo server, sử dụng các route
│── server.js           # Chạy ứng dụng

## 1. Khởi tạo dự án 
mở terminal: 
- npm init or yarn init 
## 2. Cấu hình biên dịch typescript
- tsc --init
### File cấu hình tsconfig.json
{
  "compilerOptions": {
    "target": "ES6",
    "experimentalDecorators": true,
    "module": "commonjs",
    "baseUrl": "./",
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true 
  }
}
## 3.cài dặt các thư viện (lưu ý nhớ cài thêm các gói phụ thuộc của typescript)
npm install thuvien (cài vào gói trong môi trường sản xuất)
npm install thuvien --save -dev (@type/thuvien cào vào gói trong môi trường phát triển)

### 1. các thư viện
express nodemon ts-node
### 2. các thư viện middeware bảo mật cơ bản
cors hpp morgan helmet
### 3. làm việc với biến môi trường
dotenv
### 4. làm việc với cơ sở dữ liệu (postgresql)
sequelize 
pg pg-hstore
### 5. Mã hóa dữ liệu password
bcrypt
### 6. Gửi gmail
nodemailer
### 7. JWT
jsonwebtoken
### 8. Multer
upload FORMDATA