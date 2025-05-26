import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const verifyGSTIN = async (req, res) => {

  const { gstIn } = req.params;

  
  if (!gstIn) {
    return res.status(400).json({ message: "Please provide a GSTIN number" });
  }

  // Validate GSTIN pattern: 15 characters with alphanumeric format
  const gstinPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
  if (!gstinPattern.test(gstIn)) {
    return res.status(400).json({ message: "Invalid GSTIN format" });
  }
  try {
    // Setup Cashfree API headers - replace with your actual keys
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    // const publicKey = process.env.CASHFREE_PUBLIC_KEY;
    
    // Cashfree GST Verification API endpoint
    const url = `https://api.cashfree.com/verification/gstin`;
    
    const headers = {
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      // 'x-public-key': publicKey,
      'Content-Type': 'application/json'
    };

    // Make API call to Cashfree with the provided GSTIN
    const response = await axios.post(
      url, 
      { gstin: gstIn },
      { headers }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    // Handle specific HTTP status codes
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

      // Other API-related errors
      return res.status(status).json({
        message: "Error from GSTIN API",
        details: error.response.data,
      });
    }

    // Handle network or unexpected errors
    console.error("Unexpected error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export { verifyGSTIN };
