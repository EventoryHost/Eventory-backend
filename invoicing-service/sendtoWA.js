import axios from "axios";

export async function sendInvoiceToWhatsApp(link, mobile, vendorName = "Vendor") {
  const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  const headers = {
    Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const messageResponse = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: mobile,
        type: "template",
        template: {
          name: "vendor_onboarding_message_1_v1",
          language: {
            code: "en",
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "document",
                  document: {
                    link: link,
                    filename: "invoice-eventory.pdf", 
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: vendorName, 
                },
              ],
            },
          ],
        },
      },
      { headers }
    );

    const secondMessageResponse = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: mobile,
        type: "template",
        template: {
          name: "vendor_onboarding_message_2_v1",
          language: {
            code: "en",
          },
        },
      },
      { headers }
    );

    return {
      firstMessage: messageResponse.data,
      secondMessage: secondMessageResponse.data,
    }
  } catch (error) {
    console.error("Error sending invoice:", error.response?.data || error.message);
    throw error;
  }
}
