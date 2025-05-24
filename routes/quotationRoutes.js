import express from "express";
import { Quotation } from "../models/quotation.js";
import { Customer } from "../models/customer.js";
import { getQuotations } from "../controllers/quotationController.js";
import generateUniqueId from "../utils/generateId.js";
import { sendConfirmationMessageToWhatsapp } from "../controllers/waController.js";
import { v4 as uuidv4 } from "uuid"; // For generating unique chatId
import Chat from "../models/chat.js"; // Import Chat model

const router = express.Router();

// Create a new quotation
router.post("/", async (req, res) => {
  try {
    const parsedBudget = Number(req.body.budget);
    const parsedNumberOfGuest = Number(req.body.number_of_guest);

    // Validate budget and number_of_guest
    if (isNaN(parsedBudget) || isNaN(parsedNumberOfGuest)) {
      return res
        .status(400)
        .json({ error: "Budget and Number of Guests must be valid numbers." });
    }
    const newQuotation = new Quotation({
      // Meta Data
      user_id: req.body.user_id,
      vendor_id: req.body.vendor_id,
      service_id: req.body.service_id,

      id: generateUniqueId("quo"),
      // Data
      user_name: req.body.user_name,
      mobile: req.body.mobile,
      location: req.body.location,
      start_date: new Date(req.body.start_date),
      end_date: new Date(req.body.end_date),

      time: req.body.time,
      budget: parsedBudget,
      number_of_guest: parsedNumberOfGuest,
      requirements: req.body.requirements,
      event_type: req.body.event_type,
    });

    const customer = await Customer.findOne({ id: req.body.user_id });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const savedQuotation = await newQuotation.save();

    if (!customer.quotations) {
      customer.quotations = [];
    }

    if (
      customer.quotations.find(
        (booking) => booking.serviceId === req.body.service_id,
      )
    ) {
      return res.status(400).json({
        message: "Quotation already created for this service",
      });
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

// Get quotations by vendor_id or user_id
router.get("/", async (req, res) => {
  try {
    const { vendor_id } = req.query;
    console.log("id is ", vendor_id);

    if (!vendor_id) {
      return res.status(400).json({
        message: "vendor_id is required",
      });
    }

    // Construct query dynamically
    const query = {};
    if (vendor_id) query.vendor_id = vendor_id;
    console.log(query);
    const quotations = await Quotation.find(query);

    if (quotations.length === 0) {
      return res.status(404).json({
        message: `No quotations found for vendor_id: ${vendor_id}`,
      });
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

router.patch("/", async (req, res) => {
  try {
    const { id, status } = req.body;

    // 1. Update quotation status
    const updateResult = await Quotation.updateOne(
      { id },
      { $set: { status } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: "Quotation not found or unchanged" });
    }

    // 2. Fetch updated quotation from DB
    const updatedQuotation = await Quotation.findOne({ id });

    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found after update" });
    }

    // 3. If status is "Accepted", create a new Chat
    if (status === "Accepted") {
      const { user_id, vendor_id, service_id } = updatedQuotation;

      // Check if chat already exists
      const existingChat = await Chat.findOne({
        cusId: user_id,
        venId: vendor_id,
        serId: service_id,
      });

      if (!existingChat) {
        const newChat = await Chat.create({
          chatId: uuidv4(),
          cusId: user_id,
          venId: vendor_id,
          serId: service_id,
          rmId: "admin-rm", // or get from req/session if dynamic
        });

        console.log("✅ Chat created:", newChat.chatId);
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

router.route("/myquotations").get(getQuotations);

export default router;
