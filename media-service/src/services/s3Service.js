import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const SUPPORTED_FILE_TYPES = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",

  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const getContentType = (key) => {
  const ext = path.extname(key).toLowerCase();

  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if ([".jpg", ".jpeg"].includes(ext)) return "image/jpeg";
  if (ext === ".png") return "image/png";

  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mkv") return "video/x-matroska";
  if (ext === ".avi") return "video/x-msvideo";

  if (ext && SUPPORTED_FILE_TYPES[ext]) {
    return SUPPORTED_FILE_TYPES[ext];
  }

  const mimeType = mime.lookup(ext);
  if (mimeType) return mimeType;

  // Check if the key suggests a particular content type
  if (key.includes("/video/")) {
    return "video/mp4";
  }
  
  if (key.includes("/image/")) {
    // Check extensions in the name
    if (key.includes("original") || key.includes("preview")) {
      if (key.endsWith(".mp4")) return "video/mp4";
      if (key.endsWith(".mov")) return "video/quicktime";
      if (key.endsWith(".webm")) return "video/webm";
      if (key.endsWith(".webp")) return "image/webp";
      if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
      if (key.endsWith(".png")) return "image/png";
      if (key.endsWith(".gif")) return "image/gif";
    }
    return "image/jpeg"; // Default for image folder
  }

  return "application/octet-stream";
};

const uploadFile = (filePath, key) => {
  if (!fs.existsSync(filePath)) {
    return Promise.reject(new Error(`File does not exist: ${filePath}`));
  }

  let fileStream;
  try {
    fileStream = fs.createReadStream(filePath);
  } catch (err) {
    return Promise.reject(new Error(`Cannot read file: ${err.message}`));
  }

  const contentType = getContentType(key);
  const ext = path.extname(key).toLowerCase();
  const isVideo = contentType.startsWith("video/");

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ACL: "public-read",
    ContentType: contentType,
  };

  // Set appropriate Content-Disposition header
  if (isVideo) {
    params.ContentDisposition = "inline";
    params.CacheControl = "max-age=31536000";
  } else {
    params.ContentDisposition = `inline; filename="${path.basename(key)}"`;
  }

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.Location);
    });
  });
};


export const uploadToS3 = async ({
  originalPath,
  previewPath,
  serviceType,
  vendorId,
  originalFile
}) => {
  const timestamp = Date.now();

  const originalMimeType = originalFile?.mimetype || mime.lookup(originalPath) || "";
  let originalExt = path.extname(originalFile?.originalname || "").toLowerCase();
  
  if (!originalExt) {
    originalExt = path.extname(originalPath).toLowerCase();
  }
  
  // If still no extension, determine it from the mime type
  if (!originalExt && originalMimeType) {
    if (originalMimeType === "image/jpeg") originalExt = ".jpg";
    else if (originalMimeType === "image/png") originalExt = ".png";
    else if (originalMimeType === "image/gif") originalExt = ".gif";
    else if (originalMimeType === "image/webp") originalExt = ".webp";
    else if (originalMimeType === "video/mp4") originalExt = ".mp4";
    else if (originalMimeType === "video/quicktime") originalExt = ".mov";
    else if (originalMimeType === "video/webm") originalExt = ".webm";
    else if (originalMimeType === "video/x-matroska") originalExt = ".mkv";
    else if (originalMimeType === "video/x-msvideo") originalExt = ".avi";
    else if (originalMimeType.startsWith("video/")) originalExt = ".mp4";
    else if (originalMimeType.startsWith("image/")) {
      const ext = mime.extension(originalMimeType);
      originalExt = ext ? `.${ext}` : ".jpg";
    }
    else originalExt = `.${mime.extension(originalMimeType) || "bin"}`;
  }

  const isVideo =
    (originalMimeType && originalMimeType.startsWith("video/")) ||
    [".mp4", ".mov", ".webm", ".mkv", ".avi"].includes(originalExt);

  let previewExt = path.extname(previewPath).toLowerCase();
  
  if (!previewExt) {
    if (isVideo) {
      previewExt = ".mp4";
    } else {
      previewExt = ".webp";
    }
  }

  const previewMimeType = mime.lookup(previewPath) || "";
  const isPreviewVideo = previewMimeType.startsWith("video/");
  
  if (isVideo) {
    previewExt = ".mp4";  
  }

  const mimeFolder = isVideo ? "video" : "image";

  const originalKey = `${serviceType}/${vendorId}/${mimeFolder}/original-${timestamp}${originalExt}`;
  const previewKey = `${serviceType}/${vendorId}/${mimeFolder}/preview-${timestamp}${previewExt}`;

  const originalUrl = await uploadFile(originalPath, originalKey);
  const previewUrl = await uploadFile(previewPath, previewKey);

  console.log("Uploaded to S3:", { originalUrl, previewUrl });

  setTimeout(() => {
    try {
      if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
    } catch {}
    try {
      if (fs.existsSync(previewPath)) fs.unlinkSync(previewPath);
    } catch {}
  }, 500);

  const cloudfrontDomain = process.env.CLOUDFRONT_URL || "";

  return {
    originalUrl: `${cloudfrontDomain}${originalKey}`,
    previewUrl: `${cloudfrontDomain}${previewKey}`,
  };
};
