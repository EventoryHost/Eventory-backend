import { Router } from "express";
const authRoutes = Router();
import authController from "../controllers/authController.js";
import upload from "../middlewares/uploads.js";

authRoutes.post("/login", authController.login);
authRoutes.post("/signup", authController.signUp);
authRoutes.post("/customer-login", authController.CustomerLogin);
authRoutes.post("/customer-signup", authController.CustomerSignUp)
authRoutes.post("/verify-otp-login", authController.verifyLoginOtp);
authRoutes.post(
  "/verify-otp-customer-login",
  authController.verifyCustomerLoginOtp,
);
authRoutes.get("/google-auth", authController.authWithGoogle);
authRoutes.get("/oauth2/idpresponse", authController.googleCallback);
authRoutes.post("/add-vendor", authController.createVendor);
authRoutes.post("/get-vendor", authController.getVendor);
authRoutes.put(
  "/:id/profile-pic",
  upload("vendors").single("profilePic"),
  authController.updateProfilePic,
);
authRoutes.post("/add-business-details", authController.addBusinessDetails);
authRoutes.post("/updateVendor", authController.updateVendor);

export default authRoutes;
