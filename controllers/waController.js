import dotenv from "dotenv";
import axios from "axios";
import { Customer } from "../models/customer.js";
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


  const message = req.body;

  if (message.object) {
    if (message.entry && message.entry[0].changes && message.entry[0].changes[0].value.messages && message.entry[0].changes[0].value.messages[0]) {
      const phone_number_id = message.entry[0].changes[0].value.metadata.phone_number_id;
      const from = message.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      const msg_body = message.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

      console.log('phone number id:', phone_number_id);
      console.log('Received message from:', from);
      console.log('Message body:', msg_body);

      const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
      var customer;
      try {
        customer = await Customer.findOne({ mobile: `+` + from });
        console.log('customer:', customer);
        let body;
        (customer === null) ?
        body = "Please register as a customer to get started with Eventory. You can register by visiting our website at https://eventory.in":
          customer.bookings.length === 0 ?
            body = `Hi ${customer.name},\nyour id is ${customer.id},\nYou have no active quotes` :
            body = `Hi ${customer.name},\nyour id is ${customer.id},\nyour active quote is ${customer.bookings[0].bookingId}`


        axios({
          method: 'POST',
          url: WHATSAPP_API_URL,
          headers: { 'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}` },
          data: {
            messaging_product: 'whatsapp',
            to: from,
            text: {
              body: body
            }
          }
        })
      } catch (error) {
        console.error("Error finding customer:", error.message);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
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
