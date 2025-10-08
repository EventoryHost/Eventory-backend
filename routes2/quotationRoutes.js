import express from "express";
import  Quotations  from "../models2/quotations.js";
import { Customer } from "../models2/customer.js";
import { getQuotations } from "../controllers/quotationController.js";
import generateUniqueId from "../utils/generateId.js";
import { sendConfirmationMessageToWhatsapp } from "../controllers/waController.js";
import { v4 as uuidv4 } from "uuid"; 
import Chat2 from "../models2/chats.js";

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
    const parsedNumberOfGuest = Number(req.body.guest_count);

    if (isNaN(parsedNumberOfGuest)) {
      return res
        .status(400)
        .json({ error: "Budget and Number of Guests must be valid numbers." });
    }

    const newQuotation = new Quotations({
      customer_id: req.body.customer_id,
      vendor_id: req.body.vendor_id,
      service_id: req.body.service_id,
      customer_name: req.body.customer_name,
      customer_contact_number: req.body.customer_contact_number,
      event_location: req.body.event_location,
      event_start: new Date(req.body.event_start),
      event_end: new Date(req.body.event_end),
      guest_count: parsedNumberOfGuest,
      customer_requirements: req.body.customer_requirements,
      event_type: req.body.event_type,
      quote_status: req.body.quote_status || 'Pending', 
      location_type: req.body.location_type,
    });
    
    // Check for pre-save validation errors (e.g., event_start >= event_end)
    await newQuotation.validate();
    
    // Check if a quotation already exists for this service from the same customer
    const existingQuotation = await Quotations.findOne({
      customer_id: req.body.customer_id,
      service_id: req.body.service_id,
    });
    
    if (existingQuotation) {
      return res.status(400).json({ message: "Quotation already created for this service by this customer." });
    }

    const savedQuotation = await newQuotation.save();

    res.status(201).json({
      message: "Quotation created successfully!",
      data: savedQuotation,
    });

    setImmediate(() => {
      // The `customer` object is no longer needed to find the mobile number
      // as `customer_contact_number` is now part of the `quotation` schema.
      sendConfirmationMessageToWhatsapp({
        customer_mobile: savedQuotation.customer_contact_number,
        customer_name: savedQuotation.customer_name,
        id: savedQuotation.quotation_id, // Use the new `quotation_id` field
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

    const quotations = await Quotations.find({ vendor_id });

    if (quotations.length === 0) {
      return res.status(404).json({ message: `No quotations found for vendor_id: ${vendor_id}` });
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
    const quotations = await Quotations.find();

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
    const { quotation_id, quote_status } = req.body;
    if (!quotation_id || !quote_status) {
      return res.status(400).json({ message: "quotation_id and quote_status are required" });
    }

    const updatedQuotation = await Quotations.findOneAndUpdate(
      { quotation_id },
      { $set: { quote_status: quote_status } },
      { new: true } // Return the updated document
    );

    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (updatedQuotation.quote_status === "Accepted") {
      const { customer_id, vendor_id, service_id, quotation_id } = updatedQuotation;

      const existingChat = await Chat2.findOne({
        customer_id, // Matches new schema
        vendor_id,    // Matches new schema
        service_id,   // Matches new schema
      });

      if (!existingChat) {
        await Chat2.create({
          chat_id: quotation_id,
          customer_id,             
          vendor_id,               
          service_id,              
          em_id: "admin-rm",       
        });
      }
    }

    res.status(200).json({
      message: "Quotation updated successfully!",
      data: updatedQuotation.quote_status,
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

    const quotation = await Quotations.findOne({ quotation_id : id });

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

export default router;
