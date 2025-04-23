import { Role, User } from "../../models/index";
import {Request, Response } from "express";
import bcrypt from "bcrypt"
import nodemailer from "nodemailer"
import { AppName } from "../../config/constants";
import { getAccessToken } from "../../utils/getAccessToken";

//Gửi gmail xác nhận tài khoản 

// Cấu hình transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "thien190602@gmail.com",
      pass: "rsmp zfey ussc ikrd",
    },
  });
// Hàm gửi email
const sendEmail = async (toEmail:any, subject:any, textContent:any, htmlContent:any) => {
    try {
      const mailOptions = {
        from: 'thien190602@gmail.com', // Địa chỉ email gửi đi
        to: toEmail, // Địa chỉ email người nhận
        subject: subject, // Chủ đề email
        text: textContent, // Nội dung văn bản
        html: htmlContent, // Nội dung HTML
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email:', error);
    }
};

//Đăng ký tài khoản cho quản lý
const registerManager = async (req: Request, res: Response) => {
    const {email, firstname, lastname, phonenumber, password, country_code, provider} = req.body;
    try{
        if(email){
            //kiểm tra email đã tồn tại chưa
            const checkemail = await User.findOne({where: {email}});
            if(checkemail){
                res.status(400).json({message: "Email đã tồn tại"});
                return;
            }else{
                //Tiền xử lý dữ liệu

                //Mã hóa mật khẩu trước khi lưu vào database
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                //Tạo user mới
                const newuser = await User.create({
                    email,
                    firstname,
                    lastname,
                    phonenumber,
                    country_code,
                    provider: "local",
                    password: hashedPassword
                })
                //Tạo Role mới liên kết 1-1 với user
                const role = await Role.create({
                    id_user: newuser.id,
                    role_name: "quanly",
                })
                //Gửi email xác nhận tài khoản
                const htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; text-align: center; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                        <h1 style="color: #007bff;">Xác nhận tài khoản đối tác</h1>
                        <p style="color: #333; font-size: 16px;">
                            Chào mừng Quý vị đến với <b>${AppName}</b>. Quý vị vừa tạo tài khoản đối tác bằng địa chỉ email này: 
                            <b style="color: #007bff;">${email}</b>.
                        </p>
                        <p style="color: #555; font-size: 14px;">
                            Vui lòng nhấn vào nút bên dưới để xác nhận tài khoản của Quý vị và bắt đầu sử dụng dịch vụ của chúng tôi.
                        </p>

                        <a href="http://localhost:5173/manage/sigin-manage"
                        style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #007bff; color: white; text-decoration: none; font-size: 16px; border-radius: 5px;">
                        Xác nhận tài khoản
                        </a>

                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;">

                        <p style="color: #999; font-size: 12px;">
                            Bản quyền © 2025–2030 ${AppName}. Bảo lưu mọi quyền.
                        </p>
                        <p style="color: #999; font-size: 12px;">
                            Email này được gửi bởi ${AppName}, Thủ Dầu Một, Bình Dương, Việt Nam.
                        </p>
                    </div>
                `
                sendEmail(email, 'Tài khoản đối tác mới đã được tạo', 'Tài khoản đối tác',htmlContent)
                res.status(201).json({message: "Đăng ký thành công", user: {...newuser, ...role}});
                return;
            }
        }
        res.status(201).json({message:"đầu vào không hợp lệ"})
    }catch(err){
        res.status(404).json({message: err});
        return;
    }
}

//Đăng nhập 
const login = async (req: Request, res: Response) => {
    const {username, password} = req.body;
    try{
        const user = await User.findOne({where: {email:username}, raw: true});
        //kiểm tra tài khảon và mật khẩu
        if(!user || !bcrypt.compareSync(password, user.password||'')){
            res.status(401).json({ message: "Tài khoản hoặc mật khẩu không chính xác" });
            return;
        }
        //lấy bảng role 
        const role = await Role.findOne({
            where: {id_user: user.id}, 
            raw: true //trả về JSON
        });
        res.status(201).json({
            token: getAccessToken({ 
                ...role,
                ...user,
            })
        })
    }catch(err){
        res.status(500).json({message: err});
        return;
    }
}


//test api 
const test = async (req:Request, res: Response) => {
    const role = await Role.findAll();
    res.status(200).json(role);
}

export {
    registerManager,login, test
}