import { Router } from "express";
const razorpayRoutes = Router();
import razorpayController from "../controllers/razorpay.js";

razorpayRoutes.post("/create-order", razorpayController.createOrder);
razorpayRoutes.post("/verify-payment", razorpayController.verifyPayment);
razorpayRoutes.post("/generate-invoice", razorpayController.generateInvoiceWithDiscount);

export default razorpayRoutes;
