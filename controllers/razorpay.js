import Razorpay from "razorpay";
import generateInvoice from "../utils/generateInvoice.js";
import dotenv from "dotenv";
import { Vendor } from "../models/users.js";
import { sendEmailInvoice } from "./sesController.js";

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
    return res.status(500).json({ error: error.message });
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
          paymentDetails.created_at * 1000,
        ).toLocaleDateString(),
        id: paymentDetails.id,
      };
      const vendor = await Vendor.findOne({ id: ven_id });
      const file = await generateInvoice(vendor, formattedDetails);
      if (vendor.email) await sendEmailInvoice(vendor.email, file.pdf, file.fileName);
      await sendInvoiceToWhatsApp(
        file.url,
        vendor.mobile,
        formattedDetails.amount,
      );

      return res.json({ message: "Payment verified" });
    } else {
      return res.status(400).json({ error: "Invalid payment" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  createOrder,
  verifyPayment,
};
