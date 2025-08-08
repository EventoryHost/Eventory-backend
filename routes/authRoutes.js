import { Router } from "express";
const authRoutes = Router();
import authController from "../controllers/authController.js";
import upload from "../middlewares/uploads.js";

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login vendor using credentials
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: vendor@example.com
 *               password:
 *                 type: string
 *                 example: Pass@123
 *     responses:
 *       200:
 *         description: Login successful
 */
authRoutes.post("/login", authController.login);

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Vendor signup
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Vendor Name
 *               email:
 *                 type: string
 *                 example: vendor@example.com
 *               password:
 *                 type: string
 *                 example: Pass@123
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 */
authRoutes.post("/signup", authController.signUp);

/**
 * @swagger
 * /customer-login:
 *   post:
 *     summary: Login customer using credentials
 *     tags: [Authentication]
 */
authRoutes.post("/customer-login", authController.CustomerLogin);

/**
 * @swagger
 * /customer-signup:
 *   post:
 *     summary: Customer signup
 *     tags: [Authentication]
 */
authRoutes.post("/customer-signup", authController.CustomerSignUp);

/**
 * @swagger
 * /verify-otp-login:
 *   post:
 *     summary: Verify OTP for vendor login
 *     tags: [Authentication]
 */
authRoutes.post("/verify-otp-login", authController.verifyLoginOtp);

/**
 * @swagger
 * /verify-otp-customer-login:
 *   post:
 *     summary: Verify OTP for customer login
 *     tags: [Authentication]
 */
authRoutes.post(
  "/verify-otp-customer-login",
  authController.verifyCustomerLoginOtp
);

/**
 * @swagger
 * /google-auth:
 *   get:
 *     summary: Google OAuth login initiation
 *     tags: [Authentication]
 */
authRoutes.get("/google-auth", authController.authWithGoogle);

/**
 * @swagger
 * /oauth2/idpresponse:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 */
authRoutes.get("/oauth2/idpresponse", authController.googleCallback);

/**
 * @swagger
 * /add-vendor:
 *   post:
 *     summary: Add a new vendor
 *     tags: [Vendors]
 */
authRoutes.post("/add-vendor", authController.createVendor);

/**
 * @swagger
 * /get-vendor:
 *   post:
 *     summary: Retrieve vendor details
 *     tags: [Vendors]
 */
authRoutes.post("/get-vendor", authController.getVendor);

/**
 * @swagger
 * /{id}/profile-pic:
 *   put:
 *     summary: Update vendor profile picture
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 */
authRoutes.put(
  "/:id/profile-pic",
  upload("vendors").single("profilePic"),
  authController.updateProfilePic
);

/**
 * @swagger
 * /add-business-details:
 *   post:
 *     summary: Add business details for vendor
 *     tags: [Vendors]
 */
authRoutes.post("/add-business-details", authController.addBusinessDetails);

/**
 * @swagger
 * /updateVendor:
 *   post:
 *     summary: Update vendor details
 *     tags: [Vendors]
 */
authRoutes.post("/updateVendor", authController.updateVendor);

export default authRoutes;
