import { Router } from "express";
const router = Router();
import authController from "../controllers/authController.js";

// router.post("/login", authController.login);
// router.post("/signup", authController.signUp);
// router.post("/verify-otp-signup", authController.verifySignUpOtp);
// router.post("/verify-otp-login", authController.verifyLoginOtp)
router.get("/google-auth", authController.authWithGoogle)
router.get("/oauth2/idpresponse", authController.googleCallback)


export default router;
