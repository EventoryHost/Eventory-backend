import mongoose from "mongoose";
import Orders from "../models/orders.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const verifyOrdersValidation = async () => {
  try {
    await connectDB();
    console.log("Connected to DB");

    const now = new Date();
    const start = new Date(now.getTime());
    const end = new Date(now.getTime()); // Same time

    const order = new Orders({
      order_id: "TEST_ORDER",
      em_id: "TEST_EM",
      service_id: "TEST_SERVICE",
      vendor_id: "TEST_VENDOR",
      quotation_id: "TEST_QUO",
      vendor_manager_name: "Test Manager",
      customer_name: "Test Customer",
      customer_id: "TEST_CUST",
      event_start: start,
      event_end: end,
      event_type: "Test Event",
      event_location: "Test Location",
      final_amount: 1000,
      order_status: "pending",
      vendor_manager_contact_number: "1234567890",
      vendor_manager_contact_email: "test@vendor.com",
      customer_contact_number: "0987654321",
      customer_contact_email: "test@customer.com",
      order_created_at: now
    });

    try {
      await order.validate();
      console.log("✅ Validation passed for same start and end date.");
    } catch (err) {
      console.error("❌ Validation failed for same start and end date:", err.message);
    }

    // Negative test case
    const pastEnd = new Date(now.getTime() - 10000);
    order.event_end = pastEnd;

    try {
      await order.validate();
      console.error("❌ Validation passed for end date before start date (Should have failed).");
    } catch (err) {
      console.log("✅ Validation correctly failed for end date before start date:", err.message);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error running verification:", error);
    process.exit(1);
  }
};

verifyOrdersValidation();
