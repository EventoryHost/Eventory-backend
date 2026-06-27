import express from "express";
import { sendAboutEmail } from "../controllers/aboutEmailController.js";

const router = express.Router();

// Route specifically for About page email submissions
router.post("/send-about-email", sendAboutEmail);

export default router;
