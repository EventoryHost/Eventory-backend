import axios from "axios";

export async function sendInvoiceToWhatsApp(link, mobile) {
  // WhatsApp Business API configuration
  const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  const headers = {
    Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
  try {
    // Format invoice message
    const messageResponse = await axios.post(
      `${WHATSAPP_API_URL}`,
      {
        messaging_product: "whatsapp",
        to: `${mobile}`,
        type: "template",
        template: {
          namespace: "0049ed7f_abf6_48d9_84dc_49ea2de33f57",
          name: "vendor_receipt_onboarding",
          language: {
            code: "en_US",
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "document",
                  document: {
                    link: `${link}`,
                    filename: "invoice-eventory",
                  },
                },
              ],
            },
          ],
        },
      },
      { headers },
    );

    // Send message via WhatsApp Business API

    return messageResponse.data;
  } catch (error) {
    console.error("Error sending invoice:", error.message);
    throw error;
  }
}