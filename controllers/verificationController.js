import axios from "axios";
const verifyGSTIN = async (req, res) => {
  const { GSTIN } = req.params;

  // Validate if GSTIN is provided
  if (!GSTIN) {
    return res.status(400).json({ message: "Please provide a GSTIN number" });
  }

  // Validate GSTIN pattern: 15 characters with alphanumeric format
  const gstinPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
  if (!gstinPattern.test(GSTIN)) {
    return res.status(400).json({ message: "Invalid GSTIN format" });
  }

  try {
    // Make API call to Razorpay with the provided GSTIN
    const response = await axios.get(`https://razorpay.com/api/gstin/${GSTIN}`);
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

      if (status === 500) {
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
