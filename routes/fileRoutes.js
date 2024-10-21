import { Router } from "express";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config.js";

const router = Router();

// Initialize S3 client with AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

function getFileNameFromUrl(url) {
  const comIndex = url.indexOf(".com");

  if (comIndex === -1) {
    return null;
  }

  const substringAfterCom = url.substring(comIndex + 4);

  const dashIndex = substringAfterCom.indexOf("-");

  if (dashIndex !== -1) {
    return substringAfterCom.substring(dashIndex + 1); // No splitting to keep the extension
  }

  return null;
}

// Function to get the file size from S3 using AWS SDK v3
async function getFileSizeFromS3(url) {
  const bucketName = "eventory-bucket"; // replace with your S3 bucket name
  const key = url.split(".com/")[1]; // Extract the key from the URL

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const command = new HeadObjectCommand(params); // Create HeadObjectCommand instance
    const data = await s3Client.send(command); // Send the command using the client
    return data.ContentLength || 0; // Returns file size in bytes
  } catch (error) {
    throw new Error(`Error fetching file size: ${error.message}`);
  }
}

// Define the route
router.post("/get-file-info", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const fileName = getFileNameFromUrl(url);
    const fileSize = await getFileSizeFromS3(url);

    return res.json({
      fileName,
      fileSize, // in bytes
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
