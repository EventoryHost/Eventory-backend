import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoicesByVendor,
  getInvoicesByCustomer,
  getInvoicesByEvent,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  getRecentInvoices,
} from "../controllers/invoiceController.js";

const router = express.Router();

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoice_url
 *               - type
 *               - vendor_id
 *               - service_id
 *             properties:
 *               invoice_url:
 *                 type: string
 *                 description: URL of the invoice document
 *               type:
 *                 type: string
 *                 enum: [registration, advance_booking, booking, payment]
 *                 description: Type of invoice
 *               vendor_id:
 *                 type: string
 *                 description: ID of the vendor
 *               service_id:
 *                 type: string
 *                 description: ID of the service
 *               customer_id:
 *                 type: string
 *                 description: ID of the customer (required for non-registration invoices)
 *               event_id:
 *                 type: string
 *                 description: ID of the event (optional)
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", createInvoice);

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices with pagination and filtering
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [registration, advance_booking, booking, payment]
 *         description: Filter by invoice type
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: service_id
 *         schema:
 *           type: string
 *         description: Filter by service ID
 *       - in: query
 *         name: event_id
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of invoices retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", getInvoices);

/**
 * @swagger
 * /api/invoices/recent:
 *   get:
 *     summary: Get recent invoices
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recent invoices to retrieve
 *     responses:
 *       200:
 *         description: Recent invoices retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/recent", getRecentInvoices);

/**
 * @swagger
 * /api/invoices/stats:
 *   get:
 *     summary: Get invoice statistics
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Invoice statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/stats", getInvoiceStats);

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getInvoiceById);

/**
 * @swagger
 * /api/invoices/number/{invoice_no}:
 *   get:
 *     summary: Get invoice by invoice number
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: invoice_no
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice number
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */
router.get("/number/:invoice_no", getInvoiceByNumber);

/**
 * @swagger
 * /api/invoices/vendor/{vendor_id}:
 *   get:
 *     summary: Get invoices by vendor ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [registration, advance_booking, booking, payment]
 *         description: Filter by invoice type
 *     responses:
 *       200:
 *         description: Vendor invoices retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/vendor/:vendor_id", getInvoicesByVendor);

/**
 * @swagger
 * /api/invoices/customer/{customer_id}:
 *   get:
 *     summary: Get invoices by customer ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [registration, advance_booking, booking, payment]
 *         description: Filter by invoice type
 *     responses:
 *       200:
 *         description: Customer invoices retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/customer/:customer_id", getInvoicesByCustomer);

/**
 * @swagger
 * /api/invoices/event/{event_id}:
 *   get:
 *     summary: Get invoices by event ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Event invoices retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/event/:event_id", getInvoicesByEvent);

/**
 * @swagger
 * /api/invoices/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoice_url:
 *                 type: string
 *                 description: URL of the invoice document
 *               type:
 *                 type: string
 *                 enum: [registration, advance_booking, booking, payment]
 *                 description: Type of invoice
 *               vendor_id:
 *                 type: string
 *                 description: ID of the vendor
 *               service_id:
 *                 type: string
 *                 description: ID of the service
 *               customer_id:
 *                 type: string
 *                 description: ID of the customer
 *               event_id:
 *                 type: string
 *                 description: ID of the event
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateInvoice);

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     summary: Delete invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteInvoice);

export default router;
