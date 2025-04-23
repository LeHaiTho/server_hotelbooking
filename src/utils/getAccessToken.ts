import dotenv from 'dotenv';
import jwt from "jsonwebtoken"
// Tải file .env
dotenv.config();

export const getAccessToken = (payload: {
    //Bảng user
    id: number,
    firstname?: string|undefined,
    lastname?: string|undefined,
    phonenumber?: string|undefined,
    email?: string|undefined,
    password?: string|undefined,
    provider?: string|undefined,//Kiểu đăng nhập google, fabook
    provider_id?: string|undefined, //id
    image_url?: string|undefined,
    country_code?: string|undefined,
    email_verified?: boolean|undefined,
    //Bảng role
    role_name?:string|undefined
})=> {
    const token = jwt.sign(payload, process.env.SECRET_KEY as string,{expiresIn:'5 days'}); 
    return token
}