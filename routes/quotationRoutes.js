import express from "express";
import { Quotation } from "../models/quotation.js";
import { Customer } from "../models/customer.js";
import { getQuotations } from "../controllers/quotationController.js";
import generateUniqueId from "../utils/generateId.js";
import { sendConfirmationMessageToWhatsapp } from "../controllers/waController.js";
import { v4 as uuidv4 } from "uuid";
import Chat from "../models/chat.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quotations
 *   description: Quotation management APIs
 */

/**
 * @swagger
 * /quotations:
 *   post:
 *     summary: Create a new quotation
 *     tags: [Quotations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - vendor_id
 *               - service_id
 *               - user_name
 *               - mobile
 *               - location
 *               - start_date
 *               - end_date
 *               - time
 *               - number_of_guest
 *               - requirements
 *               - event_type
 *             properties:
 *               user_id:
 *                 type: string
 *               vendor_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               user_name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               location:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               number_of_guest:
 *                 type: integer
 *               requirements:
 *                 type: string
 *               event_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Quotation created successfully
 *       400:
 *         description: Invalid input or quotation already exists
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
  try {
    const parsedNumberOfGuest = Number(req.body.number_of_guest);

    if (isNaN(parsedNumberOfGuest)) {
      return res
        .status(400)
        .json({ error: " Number of Guests must be valid numbers." });
    }

    const newQuotation = new Quotation({
      user_id: req.body.user_id,
      vendor_id: req.body.vendor_id,
      service_id: req.body.service_id,
      id: generateUniqueId("quo"),
      user_name: req.body.user_name,
      mobile: req.body.mobile,
      location: req.body.location,
      start_date: new Date(req.body.start_date),
      end_date: new Date(req.body.end_date),
      time: req.body.time,
      number_of_guest: parsedNumberOfGuest,
      requirements: req.body.requirements,
      event_type: req.body.event_type,
    });

    const customer = await Customer.findOne({ id: req.body.user_id });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const savedQuotation = await newQuotation.save();

    if (!customer.quotations) {
      customer.quotations = [];
    }

    if (customer.quotations.find((q) => q.serviceId === req.body.service_id)) {
      return res
        .status(400)
        .json({ message: "Quotation already created for this service" });
    }

    customer.quotations.push({
      serviceId: req.body.service_id,
      quotationId: savedQuotation.id,
    });

    await customer.save();

    res.status(201).json({
      message: "Quotation created successfully!",
      data: savedQuotation,
    });

    setImmediate(() => {
      sendConfirmationMessageToWhatsapp({
        customer_mobile: customer.mobile,
        customer_name: customer.name,
        id: newQuotation.id,
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating quotation",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /quotations:
 *   get:
 *     summary: Get quotations by vendor ID
 *     tags: [Quotations]
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Quotations retrieved successfully
 *       400:
 *         description: Vendor ID is required
 *       404:
 *         description: No quotations found
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const { vendor_id } = req.query;

    if (!vendor_id) {
      return res.status(400).json({ message: "vendor_id is required" });
    }

    const quotations = await Quotation.find({ vendor_id });

    if (quotations.length === 0) {
      return res
        .status(404)
        .json({ message: `No quotations found for vendor_id: ${vendor_id}` });
    }

    res.status(200).json({
      message: "Quotations retrieved successfully!",
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving quotations",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /quotations/all:
 *   get:
 *     summary: Get all quotations
 *     tags: [Quotations]
 *     responses:
 *       200:
 *         description: All quotations retrieved successfully
 *       404:
 *         description: No quotations found
 *       500:
 *         description: Server error
 */
router.get("/all", async (req, res) => {
  try {
    const quotations = await Quotation.find();

    if (quotations.length === 0) {
      return res.status(404).json({ message: "No quotations found" });
    }

    res.status(200).json({
      message: "All quotations retrieved successfully!",
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving all quotations",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /quotations:
 *   patch:
 *     summary: Update quotation status
 *     tags: [Quotations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Pending, Accepted, Rejected]
 *     responses:
 *       200:
 *         description: Quotation updated successfully
 *       404:
 *         description: Quotation not found
 *       500:
 *         description: Server error
 */
router.patch("/", async (req, res) => {
  try {
    const { id, status } = req.body;

    const updateResult = await Quotation.updateOne(
      { id },
      { $set: { status } }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Quotation not found or unchanged" });
    }

    const updatedQuotation = await Quotation.findOne({ id });

    if (!updatedQuotation) {
      return res
        .status(404)
        .json({ message: "Quotation not found after update" });
    }

    if (status === "Accepted") {
      const { user_id, vendor_id, service_id } = updatedQuotation;

      const existingChat = await Chat.findOne({
        cusId: user_id,
        venId: vendor_id,
        serId: service_id,
      });

      if (existingChat) {
        console.log("Chat already exists between customer and vendor.");
        return;
      }

      if (!existingChat) {
        await Chat.create({
          chatId: id,
          cusId: user_id,
          venId: vendor_id,
          serId: service_id,
          rmId: "admin-rm",
        });
        console.log("New chat created between customer and vendor.");
      }
    }

    res.status(200).json({
      message: "Quotation updated successfully!",
      data: updatedQuotation.status,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating quotation",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /quotations/myquotations:
 *   get:
 *     summary: Get quotations for logged-in user
 *     tags: [Quotations]
 *     responses:
 *       200:
 *         description: Quotations retrieved successfully
 *       500:
 *         description: Server error
 */
router.route("/myquotations").get(getQuotations);

/**
 * @swagger
 * /quotations/{id}:
 *   get:
 *     summary: Get a specific quotation by ID
 *     tags: [Quotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     responses:
 *       200:
 *         description: Quotation retrieved successfully
 *       404:
 *         description: Quotation not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findOne({ id });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.status(200).json({
      message: "Quotation retrieved successfully!",
      quotation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving quotation",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleteResult = await Quotation.deleteOne({ id });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.status(200).json({
      message: "Quotation deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting quotation",
      error: error.message,
    });
  }
});

export default router;
