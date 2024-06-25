import { Router } from "express";
const router = Router();
import authController from "../controllers/authController.js";
import authController2 from "../controllers/authController2.js";

// router.post("/login", authController.login);
// router.post("/signup", authController.signUp);
// router.post("/verify-otp-signup", authController.verifySignUpOtp);
// router.post("/verify-otp-login", authController.verifyLoginOtp)
router.get("/google-auth", authController.authWithGoogle);
router.get("/oauth2/idpresponse", authController.googleCallback);
router.post("/otp", authController2.OTP);
router.post("/verify-otp", authController2.verifyOTP);

export default router;
