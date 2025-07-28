import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: "ap-south-1", 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET
  }
});

const getInvoiceCount = async () => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
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

export { getInvoiceCount };
