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
      file: req.file,
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

    const videoExts = [".mp4", ".mov", ".webm", ".mkv", ".avi"];
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    let processedPaths;

    if (ext === ".webp" || mimeType === "image/webp") {
      processedPaths = await compressImage(req.file.path);
    } else if (mimeType.startsWith("image/") || imageExts.includes(ext)) {
      processedPaths = await compressImage(req.file.path);
    } else if (mimeType.startsWith("video/") || videoExts.includes(ext)) {
      processedPaths = await compressVideo(req.file.path);
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported file type: ${mimeType} (${ext})`,
      });
    }

    const { originalPath, previewPath, compressedPath } = processedPaths;

    const uploadResult = await uploadToS3({
      originalPath,
      previewPath: previewPath || compressedPath,
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
