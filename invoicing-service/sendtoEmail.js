import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const ses = new SESClient({
  region: "ap-south-1", credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET
  }
});

export async function sendInvoiceEmail({ to, subject, text, pdfBuffer, pdfFileName }) {
  // Create a Nodemailer transporter using SES
  const transporter = nodemailer.createTransport({
    SES: { ses, aws: { SendRawEmailCommand } }
  });

  // Compose the email
  const mailOptions = {
    from: "registrations@eventory.in",
    to,
    subject,
    text,
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  };

  // Send the email
  await transporter.sendMail(mailOptions);
}