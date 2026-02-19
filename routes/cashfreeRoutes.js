import { Router } from "express";
import cashfreeController from "../controllers/cashfree.js";

const cashfreeRoutes = (io) => {
  const router = Router();

  // Middleware to attach io to req
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  router.post("/create-order", cashfreeController.createOrder);
  router.post("/verify-payment", cashfreeController.verifyPayment);
  router.post("/generate-invoice", cashfreeController.sendInvoice);
  router.get("/payment-session/:order_id", cashfreeController.getPaymentSession);
  router.post("/webhook", cashfreeController.handleWebhook);
  router.post("/verify-customer-payment", cashfreeController.verifyCustomerPayment);
  router.post("/get-payment-by-order-id", cashfreeController.getPaymentByOrderId);

  return router;
};

export default cashfreeRoutes;
