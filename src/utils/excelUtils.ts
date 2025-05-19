import ExcelJS from "exceljs";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  // Cấu hình email server
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Tạo file Excel từ dữ liệu và trả về đường dẫn tới file
 */
export const generateExcelFile = async (
  data: any[],
  filename: string
): Promise<string> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Đối soát doanh thu");

    // Định nghĩa các cột
    const columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key: key,
      width: 20,
    }));

    worksheet.columns = columns;

    // Thêm dữ liệu
    worksheet.addRows(data);

    // Định dạng header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    // Định dạng dòng tổng cộng (dòng cuối)
    const lastRow = worksheet.rowCount;
    worksheet.getRow(lastRow).font = { bold: true };
    worksheet.getRow(lastRow).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFCC99" },
    };

    // Định dạng các cột tiền tệ
    const currencyColumns = [
      "Tiền phòng gốc",
      "Tổng doanh thu",
      "Hoa hồng (15%)",
      "Thực nhận",
    ];

    currencyColumns.forEach((columnName) => {
      const column = worksheet.getColumn(columnName);
      column.numFmt = "#,##0 VND";
    });

    // Lưu file
    const filePath = path.join(__dirname, "..", "..", "uploads", filename);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  } catch (error) {
    console.error("Lỗi khi tạo file Excel:", error);
    throw error;
  }
};

/**
 * Gửi email với file đính kèm
 */
export const sendEmailWithAttachment = async (
  to: string,
  subject: string,
  html: string,
  attachmentPath: string,
  attachmentName: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      attachments: [
        {
          filename: attachmentName,
          path: attachmentPath,
        },
      ],
    });
    // Xóa file tạm sau khi gửi
    await unlinkAsync(attachmentPath);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    throw error;
  }
};

/**
 * Tạo nội dung email HTML
 */
export const createReconciliationEmailTemplate = (
  hotelName: string,
  month: number,
  year: number,
  data: {
    totalBookings: number;
    totalRevenue: number;
    totalCommission: number;
    remainingAmount: number;
  }
): string => {
  // Tính ngày hiện tại
  const currentDate = new Date();

  // Tính ngày hạn chót xác nhận (thêm 5 ngày)
  const deadlineDate = new Date(currentDate);
  deadlineDate.setDate(currentDate.getDate() + 5);

  // Format các ngày
  const formattedCurrentDate = currentDate.toLocaleDateString("vi-VN");
  const formattedDeadlineDate = deadlineDate.toLocaleDateString("vi-VN");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333;">Báo Cáo Đối Soát Doanh Thu</h2>
        <h3 style="color: #666;">${hotelName} - Tháng ${month}/${year}</h3>
      </div>
      
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
        <p style="margin: 5px 0;">Kính gửi <strong>Quý đối tác</strong>,</p>
        <p style="margin: 5px 0;">Chúng tôi gửi đến Quý đối tác báo cáo đối soát doanh thu chi tiết cho tháng ${month}/${year}.</p>
        <p style="margin: 5px 0;">Vui lòng kiểm tra file đính kèm để xem chi tiết các giao dịch.</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: #333;">Tóm tắt báo cáo:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 10px; border: 1px solid #ddd;">Tổng số đơn đặt phòng</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${
              data.totalBookings
            }</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Tổng doanh thu</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${data.totalRevenue.toLocaleString(
              "vi-VN"
            )} VND</td>
          </tr>
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 10px; border: 1px solid #ddd;">Hoa hồng (15%)</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${data.totalCommission.toLocaleString(
              "vi-VN"
            )} VND</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Số tiền được nhận</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${data.remainingAmount.toLocaleString(
              "vi-VN"
            )} VND</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-bottom: 20px; padding: 15px; background-color: #fff8e1; border-radius: 5px; border-left: 4px solid #ffc107;">
        <p style="margin: 5px 0; font-weight: bold;">Thông báo quan trọng:</p>
        <p style="margin: 5px 0;">Quý đối tác vui lòng kiểm tra lại thông tin doanh thu trong báo cáo này. Nếu có bất kỳ sai sót nào, xin vui lòng liên hệ với chúng tôi qua hotline <strong>1900 xxxx</strong> trước ngày <strong>${formattedDeadlineDate}</strong>.</p>
        <p style="margin: 5px 0;">Sau ngày <strong>${formattedDeadlineDate}</strong>, bộ phận kế toán sẽ tiến hành thanh toán doanh thu cho Quý đối tác và chúng tôi sẽ không nhận giải quyết các vấn đề khiếu nại liên quan đến báo cáo này.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
        <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
        <p style="margin: 5px 0;">Email: support@booking.com</p>
        <p style="margin: 5px 0;">Hotline: 1900 888888</p>
        <p style="margin: 5px 0;">Ngày gửi báo cáo: ${formattedCurrentDate}</p>
        <p style="margin-top: 20px; text-align: center;">© ${year} Hệ Thống Đặt Phòng</p>
      </div>
    </div>
  `;
};
