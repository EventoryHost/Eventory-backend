import { Router } from "express";
const authRoutes = Router();
import authController from "../controllers/authController.js";
import authController2 from "../controllers/authController2.js";

authRoutes.post("/login", authController.login);
authRoutes.post("/signup", authController.signUp);
authRoutes.post("/verify-otp-signup", authController.verifySignUpOtp);
authRoutes.post("/verify-otp-login", authController.verifyLoginOtp);
authRoutes.get("/google-auth", authController.authWithGoogle);
authRoutes.get("/oauth2/idpresponse", authController.googleCallback);

export default authRoutes;
