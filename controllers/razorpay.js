import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";

const createOrder = async (req, res) => {
  var { amount, currency, receipt } = req.body;
  amount = parseInt(amount);
  receipt = receipt.toString();
  console.log(amount, currency, receipt);

  try {
    const key_id = process.env.RAZORPAY_KEY;
    const key_secret = process.env.RAZORPAY_SECRET;
    console.log(key_id, key_secret);
    var razorpay = new Razorpay({
      key_id,
      key_secret,
    });
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

const verifyPayment = async (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  try {
    const key_secret = process.env.RAZORPAY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(order_id + "|" + payment_id) 
      .digest("hex");
    console.log(generatedSignature)
    console.log(signature)
    if (generatedSignature === signature) {
      return res.json({ message: "Payment verified" });
    } else {
      return res.status(400).json({ error: "Invalid payment" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { createOrder, verifyPayment };
