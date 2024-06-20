import { Router } from "express";
const router = Router();
import authController from "../controllers/authController.js";

router.post("/login", authController.login);
router.post("/signup", authController.signUp);
router.post("/verify-otp", authController.verifyOtp);

export default router;
