import multer from "multer"
import path from "path"
import fs from "fs";
//Tạo ngay trong middle này luôn
const storage = multer.diskStorage({
    destination: async(req, file, cb)=>{
        const {idhotel} = req.params;
        const filepath = path.join(__dirname, `../../../storage/hotel/${idhotel}`);
        if(!fs.existsSync(filepath)){
          fs.mkdirSync(filepath, {recursive: true}); // Tạo thư mục nếu chưa tồn tại
      }
        cb(null, filepath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên file
    }
  });

const upload = multer({ storage: storage });

export default upload;