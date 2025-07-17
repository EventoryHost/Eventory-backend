import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
const s3 = new S3Client({ region: "ap-south-1" });

export async function uploadToS3(pdfBuffer, key) {
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `invoices/${key}`,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        ServerSideEncryption: "AES256",
        ACL: "public-read",
    };

    try {
        await s3.send(new PutObjectCommand(uploadParams));
        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/invoices/${key}`;
    } catch (err) {
        console.error("Error uploading file:", err);
        throw err;
    }
}
