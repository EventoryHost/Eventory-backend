import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DeleteIdentityCommand, SES, SESClient } from "@aws-sdk/client-ses";
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

export async function deleteSesObject(identity) {
    const ses = new SESClient({
        region: "ap-south-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET,
        }
    });

    const deleteCommand = new DeleteIdentityCommand({
        identity: identity,
    });
    return ses.send(deleteCommand).then(() => {
        console.log(`Deleted SES identity: ${identity}`);
    }).catch((err) => {
        
    })
    })
    })
}


