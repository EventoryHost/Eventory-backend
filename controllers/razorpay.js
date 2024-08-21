import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

const createOrder = async (req, res) => {
  const { amount, currency, receipt } = req.body;

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
      receipt,
    });
    return res.json(order);  
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { createOrder };
