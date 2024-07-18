import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../config/awsConfig.js";
import dotenv from "dotenv";
dotenv.config();

const getFolderName = (mimeType) => {
  switch (mimeType) {
    case "application/pdf":
      return "documents/";
    case "image/jpeg":
    case "image/png":
    case "image/gif":
      return "images/";
    case "video/mp4":
    case "video/mpeg":
      return "videos/";
    default:
      return "others/";
  }
};

const upload = (vendorType) =>
  multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      acl: "public-read",

      key: (req, file, cb) => {
        const folder = `${vendorType}/${req.body.name}/${getFolderName(file.mimetype)}`;
        const filename = `${folder}${file.originalname}`;
        cb(null, filename);
      },
    }),
  });

export default upload;
