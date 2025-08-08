import { Router } from "express";
const cashfreeRoutes = Router();
import cashfreeController from "../controllers/cashfree.js";

/**
 * @swagger
 * /create-order:
 *   post:
 *     summary: Create a new Cashfree payment order
 *     tags: [Cashfree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderAmount:
 *                 type: number
 *                 example: 1000
 *               orderCurrency:
 *                 type: string
 *                 example: INR
 *               customerName:
 *                 type: string
 *                 example: John Doe
 *               customerEmail:
 *                 type: string
 *                 example: john@example.com
 *               customerPhone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Order created successfully
 */

cashfreeRoutes.post("/create-order", cashfreeController.createOrder);
/**
 * @swagger
 * /verify-payment:
 *   post:
 *     summary: Verify a Cashfree payment
 *     tags: [Cashfree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: order_123
 *               paymentId:
 *                 type: string
 *                 example: pay_456
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
cashfreeRoutes.post("/verify-payment", cashfreeController.verifyPayment);
/**
 * @swagger
 * /generate-invoice:
 *   post:
 *     summary: Generate and send an invoice for a completed payment
 *     tags: [Cashfree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: order_123
 *               email:
 *                 type: string
 *                 example: customer@example.com
 *     responses:
 *       200:
 *         description: Invoice sent successfully
 */
cashfreeRoutes.post(
  "/generate-invoice",
  cashfreeController.sendInvoice,
);
/**
 * @swagger
 * /payment-session/{order_id}:
 *   get:
 *     summary: Retrieve a Cashfree payment session by order ID
 *     tags: [Cashfree]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *     responses:
 *       200:
 *         description: Payment session details retrieved successfully
 */
cashfreeRoutes.get("/payment-session/:order_id", cashfreeController.getPaymentSession);
/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Handle Cashfree webhook events
 *     tags: [Cashfree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payload sent by Cashfree on payment status change
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */

cashfreeRoutes.post("/webhook", cashfreeController.handleWebhook);
/**
 * @swagger
 * /verify-customer-payment:
 *   post:
 *     summary: Verify customer payment details
 *     tags: [Cashfree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cust_789
 *               orderId:
 *                 type: string
 *                 example: order_123
 *     responses:
 *       200:
 *         description: Customer payment verified successfully
 */

cashfreeRoutes.post("/verify-customer-payment", cashfreeController.verifyCustomerPayment);

export default cashfreeRoutes;
