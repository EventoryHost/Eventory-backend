import express from "express";
import multer from "multer";
import { uploadMedia } from "../controllers/mediaController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

router.post("/upload", upload.single("file"), uploadMedia);

export default router;
