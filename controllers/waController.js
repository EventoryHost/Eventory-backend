import dotenv from "dotenv";
import axios from "axios";
import { Customer } from "../models/customer.js";
import { Vendor } from "../models/users.js";
import { Quotation } from "../models/quotation.js";
dotenv.config();

async function sendInvoiceToWhatsApp(link, mobile, amount) {
  // WhatsApp Business API configuration
  const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

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
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: `${amount}`,
                },
                {
                  type: "text",
                  text: "Eventory",
                },
                {
                  type: "text",
                  text: "receipt",
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

async function sendConfirmationMessageToWhatsapp(event) {
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
        to: `${event.customer_mobile}`,
        type: "template",
        template: {
          namespace: "0049ed7f_abf6_48d9_84dc_49ea2de33f57",
          name: "quotation_received",
          language: {
            code: "en_US",
          },
          components: [
            {
              type: "body",
              parameters: [
                {

                  type: "text",
                  text: `${event.customer_name}`,
                },
                {
                  type: "text",
                  text: `${event.service_name}`,
                },
                {
                  type: "text",
                  text: `${event.id}`
                },
              ],
            }
          ]
        },

      },

      { headers },
    )
  } catch (error) {
    console.error("Error sending confirmation message:", error.message);
    throw error;
  }
}

async function sendResponseOnIntroMessage(req, res) {

  const mobile = req.body.mobile

  var user = await Customer.findOne({ mobile }, { id: 1, name: 1, quotations: 1 })
  if (!user) {
    user = await Vendor.findOne({ mobile: mobile })
  }

  if (user) {
    const userId = user.id
    var quotations = []
    console.log(user.quotations)
    user.quotations.map((quotation) => quotations.push(quotation.quotationId))

    if (userId.startsWith("cus")) {
      var response = {
        quotations,
        "message": `Hello ${user.name}, Welcome to Eventory!`,
      }
    } else if (userId.startsWith("ven")) {
      quotations = await Quotation.find({ vendor_id: userId })
      var response = {
        quotations,
        "message": `Hello ${user.name}, welcome to Eventory!`,
      }
    } else {
      return res.status(400).json({ message: "Please register on www.eventory.in to continue" })
    }

    console.log(response)
    return res.status(200).json(response)
  }

  else {
    return res.status(400).json({ message: "Please register on www.eventory.in to continue" })
  }
}












// // Example usage
// const invoice = {
//     invoiceNumber: "INV-2024-001",
//     date: "2024-03-20",
//     amount: 299.99,
//     items: [
//         { name: "Product A", price: 199.99 },
//         { name: "Product B", price: 100.00 }
//     ],
//     totalAmount: 299.99,
//     dueDate: "2024-04-20"
// };
// const link = "https://eventory-bucket.s3.ap-south-1.amazonaws.com/invoices/vendors/ven20241115124104615/invoice-pay_PLbtYACgD919C6.pdf"
// const mobile = "+918789626570"
// const amount = "299.99"
// sendInvoiceToWhatsApp(link, mobile, amount)
//     .then(result => console.log('Success:', result))
//     .catch(error => console.error('Error:', error));

export { sendInvoiceToWhatsApp, sendConfirmationMessageToWhatsapp, sendResponseOnIntroMessage };
