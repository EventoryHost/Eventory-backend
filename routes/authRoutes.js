import { Router } from "express";
const authRoutes = Router();
import authController from "../controllers/authController.js";

authRoutes.post("/login", authController.login);
authRoutes.post("/signup", authController.signUp);
authRoutes.post("/verify-otp-signup", authController.verifySignUpOtp);
authRoutes.post("/verify-otp-login", authController.verifyLoginOtp);
authRoutes.get("/google-auth", authController.authWithGoogle);
authRoutes.get("/oauth2/idpresponse", authController.googleCallback);
authRoutes.post("/add-vendor", authController.createVendor);
authRoutes.post("/get-vendor", authController.getVendor);
authRoutes.post("/add-business-details", authController.addBusinessDetails);

export default authRoutes;
