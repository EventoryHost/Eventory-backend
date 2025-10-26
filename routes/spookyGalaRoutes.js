import express from "express";
import {
  createSpookyGalaOrder,
  getSpookyGalaOrder,
  getAllSpookyGalaOrders,
  updatePaymentStatus,
  getOrdersByEmail,
  cancelOrder,
  getSpookyGalaStats
} from "../controllers/spookyGalaController.js";

const router = express.Router();

/**
 * @swagger
 * /api/spooky-gala:
 *   post:
 *     summary: Create a new Spooky Gala order
 *     tags:
 *       - Spooky Gala
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 499
 *               basePrice:
 *                 type: number
 *                 default: 1000
 *               taxRate:
 *                 type: number
 *                 default: 0.18
 *             required:
 *               - customerEmail
 *               - quantity
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", createSpookyGalaOrder);

/**
 * @swagger
 * /api/spooky-gala/stats:
 *   get:
 *     summary: Get Spooky Gala statistics
 *     tags:
 *       - Spooky Gala
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/stats", getSpookyGalaStats);

/**
 * @swagger
 * /api/spooky-gala/orders:
 *   get:
 *     summary: Get all Spooky Gala orders (admin)
 *     tags:
 *       - Spooky Gala
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, cancelled, completed]
 *       - name: paymentStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/orders", getAllSpookyGalaOrders);

/**
 * @swagger
 * /api/spooky-gala/orders/{orderId}:
 *   get:
 *     summary: Get Spooky Gala order by ID
 *     tags:
 *       - Spooky Gala
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get("/orders/:orderId", getSpookyGalaOrder);

/**
 * @swagger
 * /api/spooky-gala/orders/{orderId}/payment:
 *   patch:
 *     summary: Update payment status
 *     tags:
 *       - Spooky Gala
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *               cashfreeOrderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.patch("/orders/:orderId/payment", updatePaymentStatus);

/**
 * @swagger
 * /api/spooky-gala/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel an order
 *     tags:
 *       - Spooky Gala
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.patch("/orders/:orderId/cancel", cancelOrder);

/**
 * @swagger
 * /api/spooky-gala/customer/{email}:
 *   get:
 *     summary: Get orders by customer email
 *     tags:
 *       - Spooky Gala
 *     parameters:
 *       - name: email
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Customer orders retrieved successfully
 *       400:
 *         description: Email is required
 *       500:
 *         description: Internal server error
 */
router.get("/customer/:email", getOrdersByEmail);

export default router;
