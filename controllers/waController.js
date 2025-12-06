import dotenv from "dotenv";
import axios from "axios";
import { Customer } from "../models/customer.js";
import { Vendor } from "../models/vendor.js";
import Quotation  from "../models/quotations.js";
import Promotion from "../models/promotions.js";
dotenv.config();

async function sendInvoiceToWhatsApp(link, mobile, amount) {
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
                  text: `${event.id}`,
                },
              ],
            },
          ],
        },
      },

      { headers },
    );
  } catch (error) {
    console.error("Error sending confirmation message:", error.message);
    throw error;
  }
}

async function sendResponseOnIntroMessage(req, res) {
  const { mobile } = req.body;

  try {
    const customer = await Customer.findOne({ contact_number: mobile });
    const vendor = await Vendor.findOne({ vendor_mobile: mobile });

    let quotations = [];
    let response = null;

    if (customer) {
      const customer_id = customer.customer_id;
      quotations = await Quotation.find({ customer_id });

      response = {
        quotations,
        message: `Hello ${customer.customer_name}, Welcome to Eventory!`,
      };

    } else if (vendor) {
      const vendor_id = vendor.vendor_id;
      quotations = await Quotation.find({ vendor_id });

      response = {
        quotations,
        message: `Hello ${vendor.vendor_id}, Welcome to Eventory!`,
      };
      
    } else {
      return res.status(400).json({
        message: "Please register on www.eventory.in to continue"
      });
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error sending response on intro message:", error.message);
    return res.status(500).json({
      message: "Something went wrong. Please try again later."
    });
  }
}

const sendPromotionTemplate = async (req, res) => {
  const { phoneNumber, vendorName, vendorType, salesPersonId } = req.body;
  const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  try {
    const currDate = new Date();

    const data = await Promotion.findOne({ promo_sent_to: phoneNumber }).lean();

    // ✅ First-time vendor → create record
    if (!data) {
      await sendWhatsAppTemplate(phoneNumber, WHATSAPP_API_URL);

      await Promotion.create({
        promo_sent_by: salesPersonId,
        promo_sent_to: phoneNumber,
        vendor_name: vendorName,
        vendor_type: vendorType,
        last_sent_at: currDate
      });

      return res.status(200).json({
        number: phoneNumber,
        status: `Promotion sent to ${phoneNumber} on ${currDate}`
      });
    }

    // ❌ If promotions are stopped for vendor
    if (data.is_promotions_stopped) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Vendor has stopped promotions on ${data.promotions_stopped_at}`
      });
    }

    // ✅ Vendor already asked for call/join messages
    if (data.call_request && data.req_to_join_wa_community) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotion already sent on ${data.last_sent_at}, vendor requested call: ${data.call_requested_at}, and join community: ${data.join_community_req_at}`
      });
    }

    if (data.call_request && !data.req_to_join_wa_community) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotion already sent on ${data.last_sent_at}, vendor requested 1:1 call on ${data.call_requested_at}`
      });
    }

    if (!data.call_request && data.req_to_join_wa_community) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotion already sent on ${data.last_sent_at}, vendor requested to join community on ${data.join_community_req_at}`
      });
    }

    // ✅ Enforce 60-day rule
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    if (data.last_sent_at > sixtyDaysAgo) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotion was already sent within 60 days on ${data.last_sent_at}`
      });
    }

    // ✅ Send again after 60 days
    await sendWhatsAppTemplate(phoneNumber, WHATSAPP_API_URL);

    await Promotion.updateOne(
      { promo_sent_to: phoneNumber },
      { $set: { last_sent_at: currDate } }
    );

    return res.status(200).json({
      number: phoneNumber,
      status: `Promotion resent on ${currDate}`
    });

  } catch (error) {
    console.error("Error sending promotion:", error.message);
    return res.status(500).json({
      error: error.message || "Internal Server Error"
    });
  }
};

const sendWhatsAppTemplate = async (phoneNumber, WHATSAPP_API_URL) => {
  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      namespace: "0049ed7f_abf6_48d9_84dc_49ea2de33f57",
      name: "vendor_promotions_template_v3",
      language: { code: "en" },
      components: [
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [{ type: "payload", payload: "JOIN_COMMUNITY" }],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "1",
          parameters: [{ type: "payload", payload: "BOOK_CALL" }],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "2",
          parameters: [{ type: "payload", payload: "STOP_PROMOTIONS" }],
        },
      ],
    },
  };

  await axios.post(WHATSAPP_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
};

const handlePromoResponse = async (req, res) => {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message || message.type !== "button") {
    return res.sendStatus(200);
  }

  const phone = message.from;
  const payload = message.button.payload;
  const currDate = new Date();

  try {
    const data = await Promotions.findOne({ promo_sent_to: phone }).lean();
    if (!data) return res.sendStatus(404);

    // ✅ JOIN COMMUNITY CASE
    if (payload === "JOIN_COMMUNITY") {

      await sendText(
        phone,
        "Thanks! Here's the link to join our WhatsApp community: https://chat.whatsapp.com/INgWzjdxUGR0DkJSJ4fgQS"
      );

      await Promotions.updateOne(
        { promo_sent_to: phone },
        {
          $set: {
            req_to_join_wa_community: true,
            join_community_req_at: currDate,
            is_promotions_stopped: false // Re-enable promotions if needed
          }
        }
      );
    }

    // ✅ BOOK 1:1 CALL CASE
    else if (payload === "BOOK_CALL") {

      await sendText(
        phone,
        "Thanks for showing interest! Someone from our team will connect with you very soon 🙌"
      );

      await saveBookingRequestToDB(phone);

      await Promotions.updateOne(
        { promo_sent_to: phone },
        {
          $set: {
            call_request: true,
            call_requested_at: currDate,
            is_promotions_stopped: false
          }
        }
      );
    }

    // ✅ STOP PROMOTIONS CASE
    else if (payload === "STOP_PROMOTIONS") {

      await sendText(
        phone,
        "Thank you for your time! We hope to serve you in future! If you still want to connect, call +91 8800725840"
      );

      await Promotions.updateOne(
        { promo_sent_to: phone },
        {
          $set: {
            is_promotions_stopped: true,
            promotions_stopped_at: currDate
          }
        }
      );
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error in handlePromoResponse:", error);
    return res.sendStatus(500);
  }
};

const sendText = async (phone, text) => {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );
};

const stopPromotionsForVendor = async (phone) => {
  try {
    await Promotion.findOneAndUpdate(
      { phoneNumber: phone },
      {
        $set: {
          "canSend.value": false,
          "canSend.updatedAt": new Date(),
        },
      },
    );
    console.log(`Stopped future promotions for ${phone}`);
  } catch (error) {
    console.error(`Error stopping promotions for ${phone}:`, error);
  }
};

const saveBookingRequestToDB = async (phone) => {
  try {
    await Promotion.findOneAndUpdate(
      { phoneNumber: phone },
      {
        $set: {
          "callRequest.value": true,
          "callRequest.updatedAt": new Date(),
        },
      },
    );
    console.log(`Saved booking request for ${phone}`);
  } catch (error) {
    console.error(`Error saving booking request for ${phone}:`, error);
  }
};

const getVendors = async (req, res) => {
  try {
    const vendors = await Promotions
      .find({}, {
        promo_sent_to: 1,
        vendor_name: 1,
        vendor_type: 1,
        last_sent_at: 1,
        is_promotions_stopped: 1,
        call_request: 1,
        req_to_join_wa_community: 1,
      })
      .sort({ last_sent_at: -1 })
      .lean();

    res.status(200).json({
      success: true,
      vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vendor data",
    });
  }
};

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
 const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const MY_TOKEN = "EVENTORY1234";

  if (mode && token) {
    if (mode === "subscribe" && token === MY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400); // Bad Request if query params missing
};

 const verifyPromoResponseWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const MY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "EVENTORY1234";

  if (mode && token) {
    if (mode === "subscribe" && token === MY_TOKEN) {
      console.log("WEBHOOK_VERIFIED for promo-response");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400); // Bad request if query params missing
};


export {
  sendInvoiceToWhatsApp,
  sendConfirmationMessageToWhatsapp,
  sendResponseOnIntroMessage,
  sendPromotionTemplate,
  handlePromoResponse,
  getVendors,
  verifyWebhook,
  verifyPromoResponseWebhook
};
