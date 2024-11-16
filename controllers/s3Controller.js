import { s3 } from "../config/awsConfig.js";
import dotenv from "dotenv";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
dotenv.config();

const uploadInvoiceToS3 = async (pdfBuffer, invoiceName) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `invoices/${invoiceName}`,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/invoices/${invoiceName}`;
  } catch (error) {
    console.error("Error uploading invoice to S3:", error);
    throw error;
  }
};

export { uploadInvoiceToS3 };
