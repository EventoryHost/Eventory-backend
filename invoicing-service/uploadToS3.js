import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
const s3 = new S3Client({
    region: "ap-south-1", credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET
    }
});

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

// New function for uploading agreements to S3
export async function uploadAgreementToS3(pdfBuffer, serviceType, vendorId) {
    const key = `agreements/${serviceType}/${vendorId}/agreement_${Date.now()}.pdf`;
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        ServerSideEncryption: "AES256",
        ACL: "public-read",
    };

    try {
        await s3.send(new PutObjectCommand(uploadParams));
        const agreementUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
        console.log("Agreement uploaded to S3:", agreementUrl);
        return agreementUrl;
    } catch (err) {
        console.error("Error uploading agreement to S3:", err);
        throw err;
    }
}


