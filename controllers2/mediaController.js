import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET,
    },
});

export const getPresignedUrls = async (req, res) => {
    try {
        const {
            originalName,
            originalType,
            previewName,
            previewType,
            serviceType,
            vendorId,
        } = req.body;

        const timestamp = Date.now();
        const originalExt = originalName.substring(originalName.lastIndexOf('.'));
        const previewExt = previewName.substring(previewName.lastIndexOf('.'));
        const mimeFolder = originalType.startsWith("image/") ? "images" : "videos";

        // These are S3 keys (locations), NOT full URLs
        const originalLocation = `${serviceType}/${vendorId}/${mimeFolder}/original-${timestamp}${originalExt}`;
        const previewLocation = `${serviceType}/${vendorId}/${mimeFolder}/preview-${timestamp}${previewExt}`;

        // Presigned URL for original
        const originalCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: originalLocation,
            ContentType: originalType,
            ACL: "public-read",
        });
        const originalUploadUrl = await getSignedUrl(s3, originalCommand, { expiresIn: 300 });

        // Presigned URL for preview
        const previewCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: previewLocation,
            ContentType: previewType,
            ACL: "public-read",
        });
        const previewUploadUrl = await getSignedUrl(s3, previewCommand, { expiresIn: 300 });

        res.json({
            originalUploadUrl,
            previewUploadUrl,
            originalLocation,
            previewLocation,
            success: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};