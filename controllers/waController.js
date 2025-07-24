import dotenv from "dotenv";
import axios from "axios";
import { Customer } from "../models/customer.js";
import { Vendor } from "../models/users.js";
import { Quotation } from "../models/quotation.js";
import { Promotion } from "../models/promo.js";
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
  const mobile = req.body.mobile;

  var user = await Customer.findOne(
    { mobile },
    { id: 1, name: 1, quotations: 1 },
  );
  if (!user) {
    user = await Vendor.findOne({ mobile: mobile });
  }

  if (user) {
    const userId = user.id;
    var quotations = [];
    console.log(user.quotations);
    user.quotations.map((quotation) => quotations.push(quotation.quotationId));

    if (userId.startsWith("cus")) {
      var response = {
        quotations,
        message: `Hello ${user.name}, Welcome to Eventory!`,
      };
    } else if (userId.startsWith("ven")) {
      quotations = await Quotation.find({ vendor_id: userId });
      var response = {
        quotations,
        message: `Hello ${user.name}, welcome to Eventory!`,
      };
    } else {
      return res
        .status(400)
        .json({ message: "Please register on www.eventory.in to continue" });
    }

    console.log(response);
    return res.status(200).json(response);
  } else {
    return res
      .status(400)
      .json({ message: "Please register on www.eventory.in to continue" });
  }
}

const sendPromotionTemplate = async (req, res) => {
  const { phoneNumber, vendorName, vendorType } = req.body; // Expecting a single number
  const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  try {
    const data = await Promotion.findOne(
      { phoneNumber },
      {
        canSend: 1,
        reqToJoinCommunity: 1,
        callRequest: 1,
        sentBeforeCount: 1,
        lastSentDate: 1,
        vendorName: 1,
        vendorType: 1,
      },
    ).lean();

    // If phone number not present — first-time vendor
    const currDate = new Date();
    if (!data) {
      await sendWhatsAppTemplate(phoneNumber, WHATSAPP_API_URL);
      await Promotion.create({
        phoneNumber,
        vendorName,
        vendorType,
        sentBeforeCount: { value: 1, updatedAt: currDate },
        canSend: { value: true, updatedAt: currDate },
        reqToJoinCommunity: { value: false, updatedAt: null },
        callRequest: { value: false, updatedAt: null },
        lastSentDate: currDate,
      });
      return res
        .status(200)
        .json({
          number: phoneNumber,
          status: `Promotion message has been sent to ${phoneNumber} on ${currDate}`,
        });
    }

    // If promotions are disabled
    if (!data.canSend?.value && (!data.canSend?.updatedAt < !data.callRequest?.updatedAt) ||
      (!data.canSend?.updatedAt < !data.reqToJoinCommunity?.updatedAt)) {
      await Promotion.updateOne({ phoneNumber }, {
        $set: {
          "canSend.value": true,
          "canSend.updatedAt": currDate
        }
      })
    }

    if (!data.canSend?.value) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Vendor has stopped the promotions on ${data.canSend?.updatedAt} .`,
      });
    }

    if (data.callRequest?.value && data.reqToJoinCommunity?.value) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotional message has already been sent on ${data.lastSentDate} and vendor has requested for 1:1 call on ${data.callRequest.updatedAt} and has requested to join the community on ${data.reqToJoinCommunity.updatedAt}.`,
      });
    }

    if (data.callRequest?.value && !data.reqToJoinCommunity?.value) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotional message has already been sent on ${data.lastSentDate} and vendor has requested for 1:1 call on ${data.callRequest.updatedAt}.`,
      });
    }

    if (!data.callRequest?.value && data.reqToJoinCommunity?.value) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotional message has already been sent on ${data.lastSentDate} and vendor has requested to join the community on ${data.reqToJoinCommunity.updatedAt}.`,
      });
    }

    // Enforce 60-day rule
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    //this is if last sent date is ahead of (today - 60days)
    if (data.lastSentDate && data.lastSentDate > sixtyDaysAgo) {
      return res.status(200).json({
        number: phoneNumber,
        status: `Promotional message has already been sent on ${data.lastSentDate}.`,
      });
    }

    // Valid vendor with canSend = true and past 60 days → send promotion
    await sendWhatsAppTemplate(phoneNumber, WHATSAPP_API_URL);

    await Promotion.updateOne(
      { phoneNumber },
      {
        $inc: { "sentBeforeCount.value": 1 },
        $set: {
          lastSentDate: currDate,
          "sentBeforeCount.updatedAt": currDate,
        },
      },
    );

    return res.status(200).json({
      number: phoneNumber,
      status: `Promotional message was again sent on ${currDate}.`,
    });
  } catch (error) {
    console.error("Error sending promotion:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Internal Server Error" });
  }
};

const sendWhatsAppTemplate = async (phoneNumber, WHATSAPP_API_URL) => {
  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      namespace: "0049ed7f_abf6_48d9_84dc_49ea2de33f57",
      name: "vendor_promotions_template_v4",
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
          parameters: [{ type: "payload", payload: "GET_SOCIALS" }],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "3",
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
    const data = await Promotion.findOne({ phoneNumber: phone }).lean();
    if (!data) return res.sendStatus(404);

    const { callRequest, reqToJoinCommunity } = data;

    if (payload === 'JOIN_COMMUNITY') {
      const canSendCondition =
        !data.canSend?.value &&
        (
          (!data.canSend?.updatedAt || currDate > data.canSend.updatedAt) ||
          (!data.canSend?.updatedAt || currDate > data.canSend.updatedAt)
        );

      const updateFields = {};

      if (canSendCondition) {
        updateFields["canSend.value"] = true;
        updateFields["canSend.updatedAt"] = currDate;
      }

      await sendText(
        phone,
        "Thanks, here's the link to join our WhatsApp community: https://chat.whatsapp.com/INgWzjdxUGR0DkJSJ4fgQS"
      );

      updateFields["reqToJoinCommunity.value"] = true;
      updateFields["reqToJoinCommunity.updatedAt"] = new Date();


      if (Object.keys(updateFields).length) {
        await Promotion.updateOne(
          { phoneNumber: phone },
          { $set: updateFields }
        );
      }
    }

    else if (payload === 'BOOK_CALL') {
      const canSendCondition =
        !data.canSend?.value &&
        (
          (!data.canSend?.updatedAt || currDate > data.canSend.updatedAt) ||
          (!data.canSend?.updatedAt || currDate > data.canSend.updatedAt)
        );

      const updateFields = {};

      if (canSendCondition) {
        updateFields["canSend.value"] = true;
        updateFields["canSend.updatedAt"] = currDate;
      }

      await sendText(
        phone,
        "Thanks for showing interest! Someone from our team will connect with you in the next few business hours."
      );

      await saveBookingRequestToDB(phone);

      if (Object.keys(updateFields).length) {
        await Promotion.updateOne(
          { phoneNumber: phone },
          { $set: updateFields }
        );
      }
    }

    else if (payload === 'STOP_PROMOTIONS') {
      await sendText(phone, "Thank you for giving us your time! We hope we'll serve you in future! If you still want to connect, call on +91 8800725840");
      await stopPromotionsForVendor(phone);
    } else if (payload === 'GET_SOCIALS') {
      const message = `
      Stay connected with us on socials:  
      📸 Instagram: https://instagram.com/eventory  
      ▶️ Youtube: https://instagram.com/eventory  
      🌐 Website: https://eventory.in`;

      await sendText(phone, message);
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
    const vendors = await Promotion.find({}).sort({ lastSentDate: -1 });

    res.status(200).json({
      success: true,
      vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
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

export {
  sendInvoiceToWhatsApp,
  sendConfirmationMessageToWhatsapp,
  sendResponseOnIntroMessage,
  sendPromotionTemplate,
  handlePromoResponse,
  getVendors,
};
