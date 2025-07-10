import { Router } from "express";
const cashfreeRoutes = Router();
import cashfreeController from "../controllers/cashfree.js";

cashfreeRoutes.post("/create-order", cashfreeController.createOrder);
cashfreeRoutes.post("/verify-payment", cashfreeController.verifyPayment);
cashfreeRoutes.post(
  "/generate-invoice",
  cashfreeController.sendInvoice,
);
cashfreeRoutes.get("/payment-session/:order_id", cashfreeController.getPaymentSession);
cashfreeRoutes.post("/webhook", cashfreeController.handleWebhook);

export default cashfreeRoutes;
