import express from "express";
import multer from "multer";
import { uploadMedia } from "../controllers/mediaController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), uploadMedia);

export default router;
