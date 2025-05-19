import { Request, Response } from "express";
const axios = require("axios").default;
const CryptoJS = require("crypto-js");
const moment = require("moment");
import { BookingHotel } from "../models";

const config: any = {
  app_id: "2554",
  key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};

// Define the PaymentOrder interface
interface PaymentOrder {
  app_id: string;
  app_trans_id: string;
  app_user: string;
  app_time: number;
  item: string;
  embed_data: string;
  amount: number;
  description: string;
  bank_code?: string;
  mac?: string; // Make mac optional or required depending on your needs
  callback_url: string;
}

const create = async (req: Request, res: Response) => {
  const { amount, bookingId, description } = req.body;
  const embed_data = {
    redirecturl: `${process.env.NGROK_URL}/payment/success?bookingId=${bookingId}`,
    bookingId,
  };
  const items = [{}];
  const transID = Math.floor(Math.random() * 1000000);

  const order: PaymentOrder = {
    app_id: config.app_id,
    app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
    app_user: "user123",
    app_time: Date.now(),
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: amount,
    description: `Thanh toán lịch phòng #${transID}`,
    callback_url: `${process.env.NGROK_URL}/payment/callback`,
  };

  const data =
    config.app_id +
    "|" +
    order.app_trans_id +
    "|" +
    order.app_user +
    "|" +
    order.amount +
    "|" +
    order.app_time +
    "|" +
    order.embed_data +
    "|" +
    order.item;

  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  try {
    const fullUrl = `${config.endpoint}?${new URLSearchParams(
      order as any
    ).toString()}`;
    console.log("Full request URL:", fullUrl);
    const result = await axios.post(config.endpoint, null, { params: order });
    res.json(result.data);
  } catch (err: any) {
    console.error("API Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Payment processing failed",
      details: err.response?.data,
    });
  }
};

const callback = async (req: Request, res: Response) => {
  try {
    let result: any = {};

    try {
      let dataStr = req.body.data;
      let reqMac = req.body.mac;

      let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
      console.log("mac =", mac);

      // kiểm tra callback hợp lệ (đến từ ZaloPay server)
      if (reqMac !== mac) {
        // callback không hợp lệ
        result.return_code = -1;
        result.return_message = "mac not equal";
      } else {
        // thanh toán thành công
        let dataJson = JSON.parse(dataStr);
        let dataJsonEmbed = JSON.parse(dataJson.embed_data);
        const bookingId = dataJsonEmbed.bookingId;
        await BookingHotel.update(
          { is_paid: true },
          { where: { id: bookingId } }
        );

        result.return_code = 1;
        result.return_message = { bookingId };
      }
    } catch (ex: any) {
      result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
      result.return_message = ex.message;
    }

    // thông báo kết quả cho ZaloPay server
    res.json(result);
  } catch (error) {
    console.log(error);
  }
};
export default { create, callback };
