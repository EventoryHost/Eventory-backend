import path from "path";
import { compressImage, compressVideo } from "../services/compressionService.js";
import { uploadToS3 } from "../services/s3Service.js";

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { serviceType, vendorId } = req.body;

    console.log("Upload request:", {
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      serviceType,
      vendorId,
    });

    if (!serviceType || !vendorId) {
      return res.status(400).json({
        success: false,
        error: "Missing serviceType or vendorId",
      });
    }

    const mimeType = req.file.mimetype || "";
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileBuffer = req.file.buffer;

    const videoExts = [".mp4", ".mov", ".webm", ".mkv", ".avi"];
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    let processedBuffers;

    if (ext === ".webp" || mimeType === "image/webp") {
      processedBuffers = await compressImage(fileBuffer);
    } else if (mimeType.startsWith("image/") || imageExts.includes(ext)) {
      processedBuffers = await compressImage(fileBuffer);
    } else if (mimeType.startsWith("video/") || videoExts.includes(ext)) {
      processedBuffers = await compressVideo(fileBuffer);
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported file type: ${mimeType} (${ext})`,
      });
    }

    const { originalBuffer, previewBuffer } = processedBuffers;

    const uploadResult = await uploadToS3({
      originalBuffer,
      previewBuffer,
      serviceType,
      vendorId,
      originalFile: req.file
    });

    res.json({
      success: true,
      originalUrl: uploadResult.originalUrl,
      previewUrl: uploadResult.previewUrl,
      type: mimeType.startsWith("image/") ? "image" : "video",
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
