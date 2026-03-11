import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const getInvoiceCount = async () => {
  try {
    const url = process.env.URL || (process.env.IS_DEV === "true" ? "http://localhost:5000" : "https://eventory.in");
    const response = await axios.get(`${url}/api/invoices?limit=1`);

    if (response.data && response.data.pagination) {
      return response.data.pagination.total_records || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error getting invoice count from API:", error?.response?.data || error.message);
    return 0;
  }
};

export { getInvoiceCount };
