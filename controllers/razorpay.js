import Razorpay from "razorpay";
import generateInvoice, {
  sendInvoiceWithDiscount,
} from "../utils/generateInvoice.js";
import dotenv from "dotenv";
import { Vendor } from "../models/users.js";
import { sendEmailInvoice } from "./sesController.js";
import { generatePaymentId } from "../utils/generateId.js";

dotenv.config();
import crypto from "crypto";
import fs from "fs";
import { sendInvoiceToWhatsApp } from "./waController.js";

const key_id = process.env.RAZORPAY_KEY;
const key_secret = process.env.RAZORPAY_SECRET;
var razorpay = new Razorpay({
  key_id,
  key_secret,
});

const createOrder = async (req, res) => {
  var { amount, currency, receipt } = req.body;
  amount = parseInt(amount);
  receipt = receipt.toString();
  console.log(amount, currency, receipt);

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt: receipt,
    });
    return res.json(order);
  } catch (error) {
    if (
      error.statusCode === 400 &&
      error.error.code === "BAD_REQUEST_ERROR" &&
      error.error.description ===
        "Order amount less than minimum amount allowed"
    ) {
      return res.status(405).json({ error: error.error.description });
    }
    return res.status(500).json({ error: error });
  }
};

const getAllPayments = async () => {
  try {
    const payments = await razorpay.payments.all();
    return console.log(payments.items[0]);
  } catch (error) {
    return console.log(error);
  }
};

const verifyPayment = async (req, res) => {
  const { order_id, payment_id, signature, ven_id } = req.body;
  try {
    const key_secret = process.env.RAZORPAY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(order_id + "|" + payment_id)
      .digest("hex");
    if (generatedSignature === signature) {
      const paymentDetails = await razorpay.payments.fetch(payment_id);
      const formattedDetails = {
        invoiceNumber: `${paymentDetails.id}`,
        invoiceDate: new Date().toLocaleDateString(),
        amount: paymentDetails.amount / 100,
        method: paymentDetails.method,
        created_at: new Date(
          paymentDetails.created_at * 1000
        ).toLocaleDateString(),
        id: paymentDetails.id,
      };
      const vendor = await Vendor.findOne({ id: ven_id });
      const file = await generateInvoice(vendor, formattedDetails);
      if (vendor.email) sendEmailInvoice(vendor.email, file.pdf, file.fileName);
      sendInvoiceToWhatsApp(file.url, vendor.mobile, formattedDetails.amount);

      return res.json({ message: "Payment verified" });
    } else {
      return res.status(400).json({ error: "Invalid payment" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

async function generateInvoiceWithDiscount(req, res) {
  try {
    const { ven_id, amount, discount } = req.body;
    const payment_id = generatePaymentId();

    const formattedDetails = {
      invoiceNumber: payment_id,
      invoiceDate: new Date().toLocaleDateString(),
      amount: amount,
      method: "None",
    };

    const vendor = await Vendor.findOne({ id: ven_id });
    const file = await sendInvoiceWithDiscount(vendor, formattedDetails, discount);
    if (vendor.email) sendEmailInvoice(vendor.email, file.pdf, file.fileName);
    sendInvoiceToWhatsApp(file.url, vendor.mobile, formattedDetails.amount);

    return res.json({ message: "Invoice sent" });
  } catch (error) {
    return res.status(400).json({ error: "Error sending invoice" });
  }
}

export default {
  createOrder,
  verifyPayment,
  generateInvoiceWithDiscount,
};
