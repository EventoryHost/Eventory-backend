// import AWS from "aws-sdk";
// import fs from "fs";
// import path from "path";
// import mime from "mime-types";

// const SUPPORTED_FILE_TYPES = {
//   ".mp4": "video/mp4",
//   ".mov": "video/quicktime",
//   ".webm": "video/webm",
//   ".mkv": "video/x-matroska",
//   ".avi": "video/x-msvideo",

//   ".png": "image/png",
//   ".jpg": "image/jpeg",
//   ".jpeg": "image/jpeg",
//   ".gif": "image/gif",
//   ".webp": "image/webp",
// };

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const determineExtensionFromPath = (filePath) => {
//   try {
//     const existingExt = path.extname(filePath).toLowerCase();
//     if (existingExt && SUPPORTED_FILE_TYPES[existingExt]) {
//       return existingExt;
//     }

//     const mimeType = mime.lookup(filePath);
//     if (mimeType) {
//       if (mimeType.startsWith("video/")) {
//         if (mimeType === "video/mp4") return ".mp4";
//         if (mimeType === "video/quicktime") return ".mov";
//         if (mimeType === "video/webm") return ".webm";
//         if (mimeType === "video/x-matroska") return ".mkv";
//         return ".mp4";
//       }

//       if (mimeType === "image/jpeg") return ".jpg";
//       if (mimeType === "image/png") return ".png";
//       if (mimeType === "image/gif") return ".gif";
//       if (mimeType === "image/webp") return ".webp";

//       const ext = mime.extension(mimeType);
//       if (ext) return `.${ext}`;
//     }

//     try {
//       const fileBuffer = fs.readFileSync(filePath, { start: 0, length: 16 });
//       if (fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8) return ".jpg";
//       if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) return ".png";
//       if (
//         fileBuffer[0] === 0x47 &&
//         fileBuffer[1] === 0x49 &&
//         fileBuffer[2] === 0x46
//       )
//         return ".gif";

//       if (
//         fileBuffer[0] === 0x52 &&
//         fileBuffer[1] === 0x49 &&
//         fileBuffer[2] === 0x46 &&
//         fileBuffer[3] === 0x46 &&
//         fileBuffer[8] === 0x57 &&
//         fileBuffer[9] === 0x45 &&
//         fileBuffer[10] === 0x42 &&
//         fileBuffer[11] === 0x50
//       ) {
//         return ".webp";
//       }

//       if (
//         fileBuffer[4] === 0x66 &&
//         fileBuffer[5] === 0x74 &&
//         fileBuffer[6] === 0x79 &&
//         fileBuffer[7] === 0x70
//       ) {
//         return ".mp4";
//       }

//       if (
//         fileBuffer[0] === 0x1a &&
//         fileBuffer[1] === 0x45 &&
//         fileBuffer[2] === 0xdf &&
//         fileBuffer[3] === 0xa3
//       ) {
//         return ".mkv";
//       }
//     } catch (signatureErr) {
//       // console.log("Error checking file signature:", signatureErr);
//     }

//     return ".jpg";
//   } catch (err) {
//     // console.error("Error in determineExtensionFromPath:", err);
//     return ".jpg";
//   }
// };

// const getContentType = (key) => {
//   const ext = path.extname(key).toLowerCase();

//   if (ext === ".webp") return "image/webp";
//   if (ext === ".gif") return "image/gif";
//   if ([".jpg", ".jpeg"].includes(ext)) return "image/jpeg";
//   if (ext === ".png") return "image/png";

//   if (ext === ".mp4") return "video/mp4";
//   if (ext === ".mov") return "video/quicktime";
//   if (ext === ".webm") return "video/webm";
//   if (ext === ".mkv") return "video/x-matroska";
//   if (ext === ".avi") return "video/x-msvideo";

//   if (ext && SUPPORTED_FILE_TYPES[ext]) {
//     return SUPPORTED_FILE_TYPES[ext];
//   }

//   const mimeType = mime.lookup(ext);
//   if (mimeType) return mimeType;

//   if (
//     key.includes("video") ||
//     key.includes("mp4") ||
//     key.includes("mov") ||
//     key.includes("mkv") ||
//     key.includes("webm")
//   ) {
//     return "video/mp4";
//   }

//   if (ext === "") return "image/jpeg";

//   return "application/octet-stream";
// };

// const uploadFile = (filePath, key) => {
//   if (!fs.existsSync(filePath)) {
//     return Promise.reject(new Error(`File does not exist: ${filePath}`));
//   }

//   let fileStream;
//   try {
//     fileStream = fs.createReadStream(filePath);
//   } catch (err) {
//     return Promise.reject(new Error(`Cannot read file: ${err.message}`));
//   }

//   const contentType = getContentType(key);
//   const ext = path.extname(key).toLowerCase();
//   const isVideo = contentType.startsWith("video/");
//   const isWebp = ext === ".webp" || contentType === "image/webp";

//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET_NAME,
//     Key: key,
//     Body: fileStream,
//     ACL: "public-read",
//     ContentType: contentType,
//   };

//   if (isVideo) {
//     params.ContentDisposition = "inline";
//     params.CacheControl = "max-age=31536000";
//   } else {
//     params.ContentDisposition = `inline; filename="${path.basename(key)}"`;
//   }

//   return new Promise((resolve, reject) => {
//     s3.upload(params, (err, data) => {
//       if (err) reject(err);
//       else {
//         if (contentType.startsWith("video/")) {
//           s3.putObjectAcl(
//             {
//               Bucket: process.env.AWS_S3_BUCKET_NAME,
//               Key: key,
//               ACL: "public-read",
//             },
//             (aclErr) => {
//               if (aclErr) console.error("Error setting ACL:", aclErr);
//             }
//           );
//         }
//         resolve(data.Location);
//       }
//     });
//   });
// };

// export const uploadToS3 = async ({ originalPath, previewPath }) => {
//   const timestamp = Date.now();

//   const originalMimeType = mime.lookup(originalPath) || "";
//   const originalExt =
//     path.extname(originalPath).toLowerCase() ||
//     determineExtensionFromPath(originalPath);
//   const isVideo =
//     (originalMimeType && originalMimeType.startsWith("video/")) ||
//     [".mp4", ".mov", ".webm", ".mkv", ".avi"].includes(originalExt);

//   let previewExt = path.extname(previewPath).toLowerCase();
//   if (!previewExt) {
//     previewExt = isVideo ? ".mp4" : ".webp";
//   }

//   if (previewExt && !SUPPORTED_FILE_TYPES[previewExt]) {
//     previewExt = isVideo ? ".mp4" : ".webp";
//   }

//   const originalKey = `media/${timestamp}-original${originalExt}`;
//   const previewKey = `media/${timestamp}-preview${previewExt}`;

//   const originalUrl = await uploadFile(originalPath, originalKey);
//   const previewUrl = await uploadFile(previewPath, previewKey);


//   setTimeout(() => {
//     try {
//       if (fs.existsSync(originalPath)) {
//         fs.unlinkSync(originalPath);
//       }
//     } catch (err) {
//       // console.log(`Warning: Could not delete original file: ${err.message}`);
//     }

//     try {
//       if (fs.existsSync(previewPath)) {
//         fs.unlinkSync(previewPath);
//       }
//     } catch (err) {
//       // console.log(`Warning: Could not delete preview file: ${err.message}`);
//     }
//   }, 500);

//   const cloudfrontDomain = process.env.CLOUDFRONT_URL || "";

//   return {
//     originalUrl: `${cloudfrontDomain}${originalKey}`,
//     previewUrl: `${cloudfrontDomain}${previewKey}`,
//   };
// };


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

/**
 * Uploads original & preview files to S3 under:
 * media/{serviceType}/{vendorId}/{mimetype}/{timestamp}-{original/preview}.ext
 */
export const uploadToS3 = async ({
  originalPath,
  previewPath,
  serviceType,
  vendorId,
  originalFile
}) => {
  const timestamp = Date.now();

  // Ensure we have a valid extension for the original file
  const originalMimeType = originalFile?.mimetype || mime.lookup(originalPath) || "";
  
  // First get extension from the original file name if available
  let originalExt = path.extname(originalFile?.originalname || "").toLowerCase();
  
  // If no extension in original filename, use extension from the uploaded path
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

  // For preview path, get the extension based on the actual file
  let previewExt = path.extname(previewPath).toLowerCase();
  
  // If preview has no extension, derive it based on file type
  if (!previewExt) {
    // For videos, the preview should be a video format
    if (isVideo) {
      // For video previews, we'll standardize on mp4
      previewExt = ".mp4";
    } else {
      // For image previews, we'll standardize on webp
      previewExt = ".webp";
    }
  }

  // Check if the preview is actually a video by checking its mime type
  const previewMimeType = mime.lookup(previewPath) || "";
  const isPreviewVideo = previewMimeType.startsWith("video/");
  
  // For video files, make sure preview extension matches the content type
  if (isVideo) {
    // If the original is video, the preview should also be a video
    // This ensures videos have video previews, not image thumbnails
    previewExt = ".mp4";  // Default video extens ion for preview
  }

  const mimeFolder = isVideo ? "video" : "image";

  // Use timestamp and proper filename with extension at the end
  const originalKey = `${serviceType}/${vendorId}/${mimeFolder}/original-${timestamp}${originalExt}`;
  const previewKey = `${serviceType}/${vendorId}/${mimeFolder}/preview-${timestamp}${previewExt}`;

  const originalUrl = await uploadFile(originalPath, originalKey);
  const previewUrl = await uploadFile(previewPath, previewKey);

  console.log("Uploaded to S3:", { originalUrl, previewUrl });

  // Cleanup local temp files
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
