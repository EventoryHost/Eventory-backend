import { Router } from "express";
const cashfreeRoutes = Router();
import cashfreeController from "../controllers2/cashfree.js";

cashfreeRoutes.post("/create-order", cashfreeController.createOrder);

cashfreeRoutes.post("/verify-payment", cashfreeController.verifyPayment);

cashfreeRoutes.post(
  "/generate-invoice",
  cashfreeController.sendInvoice,
);

cashfreeRoutes.get("/payment-session/:order_id", cashfreeController.getPaymentSession);

cashfreeRoutes.post("/webhook", cashfreeController.handleWebhook);

cashfreeRoutes.post("/verify-customer-payment", cashfreeController.verifyCustomerPayment);

// cashfreeRoutes.post("/get-payment-by-order-id", cashfreeController.getPaymentByOrderId);

cashfreeRoutes.post("/payment-invoice", cashfreeController.savePaymentInvoice);

export default cashfreeRoutes;
