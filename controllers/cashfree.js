import { Cashfree, CFEnvironment } from "cashfree-pg";

import generateInvoice from "../utils/generateInvoice.js";
import dotenv from "dotenv";
import { Vendor } from "../models/users.js";
import { Quotation } from "../models/quotation.js";
import { sendEmailInvoice } from "./sesController.js";
import { generatePaymentId } from "../utils/generateId.js";
import { sqs } from "../config/awsConfig.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

dotenv.config();

import { sendInvoiceToWhatsApp } from "./waController.js";
import axios from "axios";

const clientId = process.env.CASHFREE_CLIENT_ID_PG;
const clientSecret = process.env.CASHFREE_CLIENT_SECRET_PG;

const cashfree = process.env.IS_DEV === "true" ? new Cashfree(CFEnvironment.SANDBOX, `${clientId}`, `${clientSecret}`) :
  new Cashfree(CFEnvironment.PRODUCTION, `${clientId}`, `${clientSecret}`);




const createOrder = async (req, res) => {
  // console.log("✅ [createOrder] API Hit:", req.method, req.originalUrl);
  // console.log("➡️ Request body:", req.body);

  var { amount, currency, customer_details } = req.body;
  amount = parseFloat(amount);
  currency = currency || "INR";

  try {
    const request = {
      order_id: generatePaymentId(),
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: customer_details.id,
        customer_phone: customer_details.phone,
      },
    };

    // console.log("📤 [createOrder] Sending to Cashfree:", request);

    const response = await cashfree.PGCreateOrder(request);
    console.log("✅ [createOrder] Cashfree response:", response.data); 

    return res.json(response.data);
  } catch (error) {
    console.error("❌ [createOrder] Cashfree order creation error:", error);
    if (error.response && error.response.data) {
      return res.status(400).json({ error: error.response.data.message });
    }
    return res.status(500).json({ error: "Failed to create order" });
  }
};



const verifyPayment = async (req, res) => {
  const { order_id, ven_id, discount, couponCode } = req.body;

  try {
    const response = await cashfree.PGFetchOrder(order_id);

    if (!response.data || response.data.length === 0) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const payment = response.data



    if (payment.order_status !== "PAID") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    console.log("Payment verified:", payment);
    const formattedDetails = {
      invoiceNumber: payment.order_id,
      invoiceDate: new Date().toLocaleDateString(),
      amount: payment.order_amount,
      method: payment.order_meta.payment_methods !== null ? payment.order_meta.payment_methods : "UPI CC",
      discount: discount || 0,
      couponCode: couponCode || null,
      id: ven_id,
    };

    const vendor = await Vendor.findOne({ id: ven_id });
    const sqsMessage = {
      customer: vendor,
      paymentDetails: formattedDetails,
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
      MessageBody: JSON.stringify(sqsMessage),
    }));



    return res.status(200).json({ message: "Payment verified" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

async function sendInvoice(req, res) {
  try {
    const { ven_id, amount, discount, couponCode } = req.body;
    const payment_id = generatePaymentId();

    const formattedDetails = {
      invoiceNumber: payment_id,
      invoiceDate: new Date().toLocaleDateString(),
      amount: amount,
      discount: discount,
      couponCode: couponCode || null,
      method: "None",
      id: ven_id,
    };

    const vendor = await Vendor.findOne({ id: ven_id });
    const sqsMessage = {
      customer: vendor,
      paymentDetails: formattedDetails,
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
      MessageBody: JSON.stringify(sqsMessage),
    }));

    return res.json({ message: "Invoice sent" });
  } catch (error) {
    return res.status(400).json({ error: "Error sending invoice" });
  }
}

// Webhook handler for Cashfree payment notifications
const handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // Verify webhook signature for security
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];

    if (!timestamp || !signature) {
      return res.status(400).json({ error: "Missing webhook headers" });
    }

    // Process different webhook events
    switch (type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(data);
        break;
      case 'PAYMENT_FAILED_WEBHOOK':
        await handlePaymentFailed(data);
        break;
      case 'PAYMENT_USER_DROPPED_WEBHOOK':
        await handlePaymentDropped(data);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};

const handlePaymentSuccess = async (data) => {
  try {
    console.log("Payment successful:", data);
    // Add your payment success logic here
    // For example: update order status, send confirmation emails, etc.
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
};

const handlePaymentFailed = async (data) => {
  try {
    console.log("Payment failed:", data);
    // Add your payment failure logic here
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
};

const handlePaymentDropped = async (data) => {
  try {
    console.log("Payment dropped:", data);
    // Add your payment dropped logic here
  } catch (error) {
    console.error("Error handling payment dropped:", error);
  }
};

// Get payment session for frontend integration
const getPaymentSession = async (req, res) => {
  try {
    const { order_id } = req.params;

    const response = await Cashfree.PGOrderFetchPaymentLinks("2023-08-01", order_id);

    if (response.data) {
      return res.json({
        payment_session_id: response.data.payment_session_id,
        payment_link: response.data.payment_link
      });
    }

    return res.status(404).json({ error: "Order not found" });
  } catch (error) {
    console.error("Error fetching payment session:", error);
    return res.status(500).json({ error: "Failed to fetch payment session" });
  }
};

const verifyCustomerPayment = async (req, res) => {
  // console.log("✅ [Server] verifyCustomerPayment endpoint hit");
  const { order_id, quotation_id } = req.body;

  // console.log("➡️ order_id:", order_id);
  // console.log("➡️ quotation_id:", quotation_id);

  try {
    const response = await cashfree.PGFetchOrder(order_id);

    if (!response.data || response.data.length === 0) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const payment = response.data;

    if (payment.order_status !== "PAID") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    console.log("✅ Customer Payment verified:", payment);

    return res.status(200).json({ message: "Customer payment verified", payment });
  } catch (error) {
    console.error("❌ verifyCustomerPayment error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

const getPaymentByOrderId = async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ message: "Missing required field: order_id" });
  }

  try {
    const clientId = process.env.CASHFREE_CLIENT_ID_PG;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET_PG;
    const apiVersion = "2025-01-01";

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": apiVersion,
      "Content-Type": "application/json",
    };

    const url = process.env.IS_DEV === "true"
      ? `https://sandbox.cashfree.com/pg/orders/${order_id}/payments`
      : `https://api.cashfree.com/pg/orders/${order_id}/payments`;

    const response = await axios.get(url, { headers });

    const paymentData = response.data;

    return res.status(200).json({
      status: "SUCCESS",
      message: "Payment details fetched successfully",
      order_id,
      payments: paymentData,
    });
  } catch (error) {
    console.error("❌ getPaymentByOrderId error:", error?.response?.data || error.message);

    return res.status(500).json({
      status: "FAILED",
      message: "Failed to fetch payment details",
      error: error?.response?.data || error.message,
    });
  }
};

export default {
  createOrder,
  verifyPayment,
  sendInvoice,
  handleWebhook,
  getPaymentSession,
  verifyCustomerPayment,
  getPaymentByOrderId
};
