import axios from "axios";
import dotenv from "dotenv";
import { generateSignature } from "../utils/generateId.js";

dotenv.config();

const verifyGSTIN = async (req, res) => {
  const { gstIn } = req.params;

  if (!gstIn) {
    return res.status(400).json({ message: "Please provide a GSTIN number" });
  }

  const gstinPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
  if (!gstinPattern.test(gstIn)) {
    return res.status(400).json({ message: "Invalid GSTIN format" });
  }
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    let publicKey = `${process.env.CASHFREE_PUBLIC_KEY}`;
    

    const timestamp = Math.floor(Date.now() / 1000);

    const signature = generateSignature(clientId, publicKey, timestamp);

    const url = `https://api.cashfree.com/verification/gstin`;

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "X-Cf-Signature": signature,
      "X-Timestamp": timestamp.toString(),
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, { gstin: gstIn }, { headers });

    res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status } = error.response;

      if (status === 429) {
        return res
          .status(429)
          .json({ message: "Too many requests, please try again later" });
      }

      if (status === 404) {
        return res.status(404).json({ message: "GSTIN not found" });
      }

      return res.status(status).json({
        message: "Error from GSTIN API",
        details: error.response.data,
      });
    }

    console.error("Unexpected error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export { verifyGSTIN };
