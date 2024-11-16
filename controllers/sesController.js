import { readFileSync } from "fs";
import { ses } from "../config/awsConfig.js";
import { SendRawEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";
import mime from "mime-types";
import path from "path";
dotenv.config();

const sendEmailInvoice = async (email,pdfBuffer, fileName) => {
  try {
    const fileType = mime.lookup(fileName);

    const boundary = "----=_Part_0_123456789.123456789";
    const rawEmail = [
      `From: ${process.env.EMAIL_FROM}`,
      `To: ${email}`,
      `Subject: Your Invoice from Eventory`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      `Thank you for your payment. Please find your invoice attached.`,
      ``,
      `--${boundary}`,
      `Content-Type: ${fileType}; name="${fileName}"`,
      `Content-Disposition: attachment; filename="${fileName}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      pdfBuffer.toString("base64"),
      ``,
      `--${boundary}--`,
    ].join("\r\n");

    const params = {
      RawMessage: {
        Data: rawEmail,
      },
    };

    try {
      const command = new SendRawEmailCommand(params);
      return await ses.send(command);
    } catch (error) {
      return error.message;
    }
  } catch (error) {
    return error.message;
  }
};

export { sendEmailInvoice };
