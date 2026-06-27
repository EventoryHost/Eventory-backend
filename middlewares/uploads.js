import "dotenv/config.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const getFolderName = (mimeType) => {
  switch (mimeType) {
    case "application/pdf":
      return "documents/";
    case "image/jpeg":
    case "image/jpg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      return "images/";
    case "video/mp4":
    case "video/mpeg":
    case "video/quicktime":
    case "video/webm":
      return "videos/";
    default:
      return "others/";
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = (vendorType) =>
  multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  });

export { getFolderName }; // Export for use in controller
export default upload;
