import express from "express";
import { Quotation } from "../models/quotation.js";
import { Customer } from "../models/customer.js";
import { getQuotations } from "../controllers/quotationController.js";
import generateUniqueId from "../utils/generateId.js";
import { sendConfirmationMessageToWhatsapp } from "../controllers/waController.js";
import { v4 as uuidv4 } from "uuid";
import Chat from "../models/chat.js";
import vendorNotification from "../models/vendorNotification.js";

// The router is now created inside a function that accepts the 'io' instance.
export default (io) => {
  const router = express.Router();

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

      const newNotification = new vendorNotification({
        vendorId: savedQuotation.vendor_id,
        customerId: savedQuotation.user_id,
        message: `New quotation request from ${savedQuotation.user_name}`,
        quotationId: savedQuotation.id,
        type: "quotation", // Set the type
      });
      await newNotification.save();

      // The 'io' instance is now available here!
      io.to(`vendor-${savedQuotation.vendor_id}`).emit(
        "newQuotationNotification",
        {
          ...newNotification.toObject(),
        }
      );

      if (!customer.quotations) {
        customer.quotations = [];
      }

      if (
        customer.quotations.find((q) => q.serviceId === req.body.service_id)
      ) {
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

  router.patch("/", async (req, res) => {
    try {
      const { id, status, booking_payment_status } = req.body;

      const updateResult = await Quotation.updateOne(
        { id },
        { $set: { status, booking_payment_status } }
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
        data: updatedQuotation,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating quotation",
        error: error.message,
      });
    }
  });

  router.route("/myquotations").get(getQuotations);

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

  return router; // Return the configured router instance
};
