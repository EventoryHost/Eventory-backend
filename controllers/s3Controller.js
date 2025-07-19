import { s3 } from "../config/awsConfig.js";
import dotenv from "dotenv";
import { PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";
dotenv.config();

const uploadInvoiceToS3 = async (pdfBuffer, invoiceName) => {
  try {
    const params = {
      Bucket: `${process.env.AWS_S3_BUCKET_NAME}`,
      Key: `invoices/${invoiceName}`,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/invoices/${invoiceName}`;
  } catch (error) {
    console.error("Error uploading invoice to S3:", error);
    throw error;
  }
};

const uploadAgreementToS3 = async (pdfBuffer, serviceType, vendorId) => {
  try {
    const timestamp = Date.now();
    const params = {
      Bucket: `${process.env.AWS_S3_BUCKET_NAME}`,
      Key: `agreements/${serviceType}/${vendorId}/agreement-${timestamp}.pdf`,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/agreements/${serviceType}/${vendorId}/agreement-${timestamp}.pdf`;
  } catch (error) {
    console.error("Error uploading agreement to S3:", error);
    throw error;
  }
};

const getInvoiceCount = async () => {
  try {
    const params = {
      Bucket: `${process.env.AWS_S3_BUCKET_NAME}`,
      Prefix: "invoices/vendors/",
    };

    const command = new ListObjectsV2Command(params);
    const response = await s3.send(command);
    
    console.log("S3 response:", response);
    
    return response.Contents ? response.Contents.length : 0;
  } catch (error) {
    console.error("Error getting invoice count from S3:", error);
    return 0;
  }
};

export { uploadInvoiceToS3, uploadAgreementToS3, getInvoiceCount };
