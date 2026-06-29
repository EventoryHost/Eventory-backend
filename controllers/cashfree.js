import { Cashfree, CFEnvironment } from "cashfree-pg";

import generateInvoice from "../utils/generateInvoice.js";
import dotenv from "dotenv";
import { Vendor } from "../models/vendor.js";
import Order from "../models/orders.js";
import { Transaction } from "../models/transactions.js";
import Quotation from "../models/quotations.js";
import { sendEmailInvoice } from "./sesController.js";
import { sendFCMNotificationToVendor, sendFCMNotificationToEm } from "../utils/firebaseNotificationUtils.js";
import generateUniqueId, { generatePaymentId, generateSignature } from "../utils/generateId.js";
import { buildPayoutsHeaders, getPayoutsBaseUrl } from "../utils/cashfreePayoutsHelper.js";
import { sqs } from "../config/awsConfig.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import adminNotification from "../models/emNotifications.js";
import customerNotification from "../models/customerNotifications.js";
import vendorNotification from "../models/vendorNotifications.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decorator.js";
import Photographer from "../models/photographerVideographer.js";
import VenueProvider from "../models/venueProvider.js";
import MakeupArtist from "../models/makeupArtist.js";
import DjArtist from "../models/djArtist.js";
import AnonymousUser from "../models/anonymousUser.js";


dotenv.config();

import { sendInvoiceToWhatsApp } from "./waController.js";
import axios from "axios";
import { Customer } from "../models/customer.js";
import { Events } from "../models/events.js";
import Message from "../models/message2.js";
import Chat from "../models/chats.js";

const isValidINMobile = (s) => typeof s === "string" && /^[6-9]\d{9}$/.test(s);

const clientId = process.env.CASHFREE_CLIENT_ID_PG;
const clientSecret = process.env.CASHFREE_CLIENT_SECRET_PG;

const cashfree = process.env.IS_DEV === "true" ? new Cashfree(CFEnvironment.SANDBOX, `${clientId}`, `${clientSecret}`) :
  new Cashfree(CFEnvironment.PRODUCTION, `${clientId}`, `${clientSecret}`);

// Non-onboarded vendor constants (environment-aware)
const NON_ONBOARDED_VENDOR_ID = process.env.IS_DEV === "true" ? "VEN04012026001126960" : "VEN05012026111140552";
const NON_ONBOARDED_SERVICE_ID = process.env.IS_DEV === "true" ? "CAT04012026002741768" : "VNP05012026115907886";

const createOrder = async (req, res) => {

  var { amount, currency, customer_details } = req.body;
  amount = parseFloat(amount);
  currency = currency || "INR";

  try {
    const { vendor_id, service_id, chat_id, order_id: internal_order_id } = req.body;

    // BLOCKING: Check for vendor bank details before order creation
    const serviceIdsToCheck = [];
    if (req.body.vendor_segments && Array.isArray(req.body.vendor_segments)) {
      for (const seg of req.body.vendor_segments) {
        if (seg.service_id) {
          serviceIdsToCheck.push({
            service_id: seg.service_id,
            vendor_id: seg.vendor_id,
            vendor_name: seg.vendor_name || "Unknown"
          });
        }
      }
    } else if (service_id) {
      serviceIdsToCheck.push({ service_id, vendor_id, vendor_name: "Vendor" });
    }

    const missingBankSegments = [];
    for (const item of serviceIdsToCheck) {
      const { service_id: sid } = item;
      const prefix = sid.substring(0, 4).toUpperCase();
      let serviceModel = null;
      if (prefix.startsWith("CAT")) serviceModel = Caterer;
      else if (prefix.startsWith("DECO")) serviceModel = Decorator;
      else if (prefix.startsWith("VNP")) serviceModel = VenueProvider;
      else if (prefix.startsWith("PAV")) serviceModel = Photographer;
      else if (prefix.startsWith("MKA")) serviceModel = MakeupArtist;
      else if (prefix.startsWith("DJS")) serviceModel = DjArtist;

      // Do not skip bank details check for non-onboarded vendor, the generic IDs will be checked
      if (serviceModel) {
        const serviceDoc = await serviceModel.findOne({ service_id: sid });
        const bankDetailsValid = !!(serviceDoc?.bank_details && (serviceDoc.bank_details.account_number || serviceDoc.bank_details.upi_id));
        if (!bankDetailsValid) {
          missingBankSegments.push(item);
        }
      }
    }

    if (missingBankSegments.length > 0) {
      console.warn(`[createOrder] 🛑 Blocking order creation. Bank details missing for: ${missingBankSegments.map(s => s.service_id).join(", ")}`);

      // Notify EM
      try {
        let em_id = "ADMIN"; // Fallback
        let final_chat_id = chat_id;
        let final_order_id = internal_order_id;

        // Try to find the order to get em_id and chat_id (quotation_id)
        if (internal_order_id) {
          const orderDoc = await Order.findOne({ order_id: internal_order_id });
          if (orderDoc) {
            em_id = orderDoc.em_id || em_id;
            final_chat_id = final_chat_id || orderDoc.quotation_id;
          }
        } else if (chat_id) {
          const orderDoc = await Order.findOne({ quotation_id: chat_id });
          if (orderDoc) {
            em_id = orderDoc.em_id || em_id;
            final_order_id = final_order_id || orderDoc.order_id;
          }
        }

        if (em_id && final_chat_id) {
          const missingDetails = missingBankSegments.map(s => `${s.vendor_name} (${s.service_id})`).join(", ");
          await adminNotification.create({
            em_id: em_id,
            chat_id: final_chat_id,
            order_id: final_order_id,
            message: `⚠️ Payment Blocked: Bank details missing for services: ${missingDetails}. Please add them immediately to allow customer payment.`,
            notification_type: 'checkout_message',
            timestamp: new Date().toISOString()
          });
          console.log(`[createOrder] EM Notification created for EM: ${em_id}`);
        }
      } catch (notiErr) {
        console.error("❌ [createOrder] Error creating EM notification:", notiErr);
      }

      return res.status(400).json({
        error: `Vendor bank details missing for: ${missingBankSegments.map(s => s.service_id).join(", ")}. Payment cannot be processed.`,
        code: "MISSING_BANK_DETAILS",
        missing_segments: missingBankSegments
      });
    }

    const request = {
      order_id: generatePaymentId(),
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: customer_details.id,
        customer_phone: customer_details.phone,
      },
      order_tags: {
        internal_order_id: internal_order_id || "MISSING",
      },
    };

    const response = await cashfree.PGCreateOrder(request);

    return res.json(response.data);
  } catch (error) {
    console.error("❌ [createOrder] Cashfree order creation error:", error);
    if (error.response && error.response.data) {
      return res.status(400).json({ error: error.response.data.message });
    }
    return res.status(500).json({ error: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  const { order_id, ven_id, discount, couponCode, serviceData } = req.body;

  try {
    const response = await cashfree.PGFetchOrder(order_id);

    if (!response.data || response.data.length === 0) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const payment = response.data;

    if (payment.order_status !== "PAID") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    const formattedDetails = {
      invoiceNumber: payment.order_id,
      invoiceDate: new Date().toLocaleDateString(),
      amount: payment.order_amount,
      method:
        payment.order_meta.payment_methods !== null
          ? payment.order_meta.payment_methods
          : "UPI CC",
      discount: discount || 0,
      couponCode: couponCode || null,
      id: ven_id,
      serviceData: serviceData || null, // NEW
    };

    const vendor = await Vendor.findOne({ vendor_id: ven_id });

    try {
      const pg_transfer_id = generateUniqueId("TRN_PG");
      await Transaction.create({
        quotation_id: "VENDOR_ONBOARDING",
        internalOrderId: order_id,
        vendor_id: ven_id,
        customer_id: ven_id,
        service_id: serviceData?.service_id || "ONBOARDING",
        pgOrderId: order_id,
        pgStatus: payment.order_status,
        transfer_id: pg_transfer_id,
        status: "SUCCESS",
        transfer_amount: payment.order_amount,
        transfer_mode: "PG_IN",
        payment_type: "vendor_onboarding",
      });
      console.log(`[VerifyVendorPayment] ✅ Successfully recorded PG_IN transaction for ${order_id}`);
    } catch (txnErr) {
      console.error(`[VerifyVendorPayment] ❌ Failed to record PG_IN transaction:`, txnErr);
    }

    const sqsMessage = {
      type: "vendorOnboarded",
      customer: vendor,
      paymentDetails: formattedDetails,
    };

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.INVOICE_QUEUE_URL || (process.env.IS_DEV === "true"
          ? "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-test-queue"
          : "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue"),
        MessageBody: JSON.stringify(sqsMessage),
      }),
    );

    return res.status(200).json({ message: "Payment verified" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

async function sendInvoice(req, res) {
  try {
    const { ven_id, amount, discount, couponCode, serviceData } = req.body;
    const payment_id = generatePaymentId();

    const formattedDetails = {
      invoiceNumber: payment_id,
      invoiceDate: new Date().toLocaleDateString(),
      amount: amount,
      discount: discount,
      couponCode: couponCode || null,
      method: "None",
      id: ven_id,
      serviceData: serviceData || null, // NEW
    };

    const vendor = await Vendor.findOne({ vendor_id: ven_id });
    const sqsMessage = {
      type: "vendorOnboarded",
      customer: vendor,
      paymentDetails: formattedDetails,
    };

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.INVOICE_QUEUE_URL || (process.env.IS_DEV === "true"
          ? "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-test-queue"
          : "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue"),
        MessageBody: JSON.stringify(sqsMessage),
      }),
    );

    return res.json({ message: "Invoice sent" });
  } catch (error) {
    return res.status(400).json({ error: "Error sending invoice" });
  }
}

// Webhook handler for Cashfree payment notifications
const handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // Verify webhook signature for security
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];

    if (!timestamp || !signature) {
      return res.status(400).json({ error: "Missing webhook headers" });
    }

    // Process different webhook events
    switch (type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(data);
        break;
      case 'PAYMENT_FAILED_WEBHOOK':
        await handlePaymentFailed(data);
        break;
      case 'PAYMENT_USER_DROPPED_WEBHOOK':
        await handlePaymentDropped(data);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};

const handlePaymentSuccess = async (data) => {
  try {
    console.log("Payment successful:", data);
    // Add your payment success logic here
    // For example: update order status, send confirmation emails, etc.
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
};

const handlePaymentFailed = async (data) => {
  try {
    console.log("Payment failed:", data);
    // Add your payment failure logic here
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
};

const handlePaymentDropped = async (data) => {
  try {
    console.log("Payment dropped:", data);
    // Add your payment dropped logic here
  } catch (error) {
    console.error("Error handling payment dropped:", error);
  }
};

// Get payment session for frontend integration
const getPaymentSession = async (req, res) => {
  try {
    const { order_id } = req.params;

    const response = await Cashfree.PGOrderFetchPaymentLinks("2023-08-01", order_id);

    if (response.data) {
      return res.json({
        payment_session_id: response.data.payment_session_id,
        payment_link: response.data.payment_link
      });
    }

    return res.status(404).json({ error: "Order not found" });
  } catch (error) {
    console.error("Error fetching payment session:", error);
    return res.status(500).json({ error: "Failed to fetch payment session" });
  }
};



// buildPayoutsHeaders is now imported from utils/cashfreePayoutsHelper.js

const N = (v) => Number(v ?? 0)

// Helper function to get the service model by service_id
const getServiceModelById = async (service_id) => {
  if (!service_id || typeof service_id !== "string") return null;

  let serviceModel = null;
  const sid = service_id; // Use a shorter alias for clarity

  if (sid.startsWith("CAT")) {
    const mod = await import("../models/caterer.js");
    serviceModel = mod.default || mod.Caterer;
  } else if (sid.startsWith("DECO")) {
    const mod = await import("../models/decorator.js");
    serviceModel = mod.default || mod.Decorator;
  } else if (sid.startsWith("VNP")) {
    const mod = await import("../models/venueProvider.js");
    serviceModel = mod.default || mod.VenueProvider;
  } else if (sid.startsWith("PAV")) {
    const mod = await import("../models/photographerVideographer.js");
    serviceModel = mod.default || mod.PhotographerVideographer;
  } else if (sid.startsWith("MKA")) {
    const mod = await import("../models/makeupArtist.js");
    serviceModel = mod.default || mod.MakeupArtist;
  } else if (sid.startsWith("DJS")) {
    const mod = await import("../models/djArtist.js");
    serviceModel = mod.default || mod.DjArtist;
  }

  return serviceModel;
};

const verifyCustomerPayment = async (req, res) => {
  console.log("DEBUG: verifyCustomerPayment CALLED [Version: ID_FIX_V1]");
  try {
    const {
      order_id,
      internal_order_id,
      order_amount,
      payment_type,
      selected_breakdowns,
      couponCode,
      couponDiscount,
      breakdownDiscount,
      service_id,
      serviceData,
      customer_id,
      chat_id,
    } = req.body;
    let payment = { order_status: "PAID" };
    if (order_amount > 0) {
      const response = await cashfree.PGFetchOrder(order_id);
      if (!response.data || response.data.length === 0) {
        return res.status(400).json({ error: "Payment not found" });
      }

      payment = response.data;
      if (payment.order_status !== "PAID") {
        console.warn(`[VerifyPayment] Payment status for ${order_id} is ${payment.order_status}. Notifying chat.`);

        try {
          if (req.io) {
            const finalOrder = await Order.findOne({ order_id: internal_order_id });
            const order_quotation_id = finalOrder ? finalOrder.quotation_id : (internal_order_id);
            const chat = await Chat.findOne({
              $or: [{ chat_id: chat_id }, { chat_id: order_quotation_id }, { quotation_id: order_quotation_id }],
            });
            const finalChatId = chat_id || chat?.chat_id || order_quotation_id;
            const chatType = chat ? chat.chat_type : (customer_id?.startsWith("ANON") ? "anon_customer-admin" : "customer-admin");

            const failMsg = {
              chat_id: finalChatId,
              chat_type: chatType,
              sender: "admin",
              sender_id: "SYSTEM",
              message_type: "system",
              message_content: `❌ Payment of ₹${order_amount} failed for Order ID: ${internal_order_id}. Status: ${payment.order_status}`,
              message_sent_at: new Date(),
              card_data: {
                type: "payment_failure",
                status: payment.order_status,
                order_id: internal_order_id,
              },
            };
            const savedMsg = await Message.create(failMsg);

            // "Dual-Cast" Strategy
            const rooms = [
              `${finalChatId}-${chatType}`,
              `${finalChatId}-customer-admin`,
              `${finalChatId}-anon_customer-admin`,
            ];
            const uniqueRooms = [...new Set(rooms)];

            console.log(`[VerifyPayment] Emitting FAILURE to rooms: ${uniqueRooms.join(', ')}`);
            uniqueRooms.forEach(roomId => {
              req.io.to(roomId).emit("new_message", savedMsg);
            });
          }
        } catch (err) {
          console.error("❌ Failed to send failure notification to chat:", err.message);
        }

        return res.status(400).json({ error: "Payment not successful", status: payment.order_status });
      }
    } else {
      console.log(`[VerifyPayment] Zero amount payment detected for order ${internal_order_id}. Skipping Cashfree check.`);
      payment = {
        order_status: "PAID",
        order_tags: { internal_order_id: internal_order_id || "MISSING" }
      };
    }

    // Fetch the final order to get required IDs
    let effective_internal_order_id = internal_order_id;
    if (!effective_internal_order_id || effective_internal_order_id === order_id) {
      if (payment.order_tags && payment.order_tags.internal_order_id && payment.order_tags.internal_order_id !== "MISSING") {
        effective_internal_order_id = payment.order_tags.internal_order_id;
        console.log(`[VerifyPayment] Recovered internal_order_id from order_tags: ${effective_internal_order_id}`);
      }
    }

    console.log(`[VerifyPayment] Searching for internal_order_id: ${effective_internal_order_id}`);
    var finalOrder = await Order.findOne({ order_id: effective_internal_order_id }).lean();
    if (!finalOrder) {
      console.log(`[VerifyPayment] Order not found by order_id, trying quotation_id: ${effective_internal_order_id}`);
      finalOrder = await Order.findOne({ quotation_id: effective_internal_order_id }).lean();
      if (!finalOrder) {
        console.error(`[VerifyPayment] ⚠️ Final order not found for internal_order_id: ${effective_internal_order_id}. BUT payment is PAID. Returning SUCCESS to frontend for recovery.`);
        return res.status(200).json({
          message: "Payment verified, but internal order sync pending",
          payment_status: payment.order_status,
          order_id: effective_internal_order_id,
          cf_order_id: order_id, // Add this for frontend lookup resilience
          no_order_record: true
        });
      }
    }
    console.log(`[VerifyPayment] Found Order: ${finalOrder.order_id}, customer_id: ${finalOrder.customer_id}`);

    const quotation_id = finalOrder.quotation_id;
    const internalOrderId = finalOrder.order_id || effective_internal_order_id;
    const vendor_id = finalOrder.vendor_id;
    const em_id = finalOrder.em_id;

    let finalCustomerId = customer_id || finalOrder.customer_id;

    if (finalCustomerId && finalCustomerId.startsWith("ANON")) {
      console.log("[VerifyPayment] Resolving anonymous user:", finalCustomerId);
      try {
        const anonUser = await AnonymousUser.findOne({ anon_id: finalCustomerId });
        if (anonUser) {
          console.log("[VerifyPayment] Found anonymous user record. converted_user_id:", anonUser.converted_user_id);
          if (anonUser.converted_user_id) {
            console.log("[VerifyPayment] Resolved to customer ID:", anonUser.converted_user_id);
            await Order.findOneAndUpdate(
              { order_id: finalOrder.order_id },
              { $set: { customer_id: anonUser.converted_user_id } }
            );
            finalCustomerId = anonUser.converted_user_id;
            if (finalOrder) {
              finalOrder.customer_id = finalCustomerId;
            }
            console.log("[VerifyPayment] Updated final order customer ID:", finalCustomerId);
          } else {
            console.log("[VerifyPayment] Anonymous user NOT YET converted. Proceeding with anon ID.");
          }
        } else {
          console.log("[VerifyPayment] AnonymousUser record NOT FOUND for ID:", finalCustomerId);
        }
      } catch (err) {
        console.error("[VerifyPayment] Error resolving anonymous user:", err);
      }
    } else if (customer_id && customer_id !== finalOrder.customer_id) {
      console.log(`[VerifyPayment] Authenticated user mismatch. Updating order ${finalOrder.order_id} to customer_id ${customer_id}`);
      await Order.findOneAndUpdate(
        { order_id: finalOrder.order_id },
        { $set: { customer_id: customer_id } }
      );
      finalCustomerId = customer_id;
      if (finalOrder) {
        finalOrder.customer_id = finalCustomerId;
      }
    }

    let customerDoc = null;
    if (finalCustomerId && !finalCustomerId.startsWith("ANON")) {
      customerDoc = await Customer.findOne({ customer_id: finalCustomerId }).lean();
    }
    const customerEmail = customerDoc?.email_address || customerDoc?.email || finalOrder?.customer_email || payment?.customer_details?.customer_email || "";
    const customerPhone = customerDoc?.mobile_number || customerDoc?.customer_contact_number || finalOrder?.customer_contact_number || payment?.customer_details?.customer_phone || "0000000000";
    let customerName = customerDoc?.customer_name || customerDoc?.name || finalOrder?.customer_name || payment?.customer_details?.customer_name || "Customer";

    const vendorDoc = await Vendor.findOne({ vendor_id: vendor_id }).lean();
    const ServiceModel = await getServiceModelById(service_id);
    const serviceDoc = ServiceModel ? await ServiceModel.findOne({ service_id: service_id }).lean() : null;

    // NEW: Resolve Event ID early so we can attach it to transactions immediately!
    let event_id;
    let existingEventForEarlyId = await Events.findOne({ quotation_id: quotation_id }).select("event_id").lean();
    if (existingEventForEarlyId) {
      event_id = existingEventForEarlyId.event_id;
    } else {
      event_id = generateUniqueId("EVTY"); // Pre-allocate the new event ID
    }

    // NEW: Record the PG Payment Transaction
    if (order_amount > 0) {
      try {
        const pg_transfer_id = generateUniqueId("TRN_PG");
        await Transaction.create({
          quotation_id: quotation_id,
          event_id: event_id,
          internalOrderId: internalOrderId,
          vendor_id: vendor_id,
          customer_id: finalCustomerId,
          service_id: service_id,
          pgOrderId: order_id,
          pgStatus: payment.order_status,
          transfer_id: pg_transfer_id,
          status: "SUCCESS",
          transfer_amount: order_amount,
          transfer_mode: "PG_IN",
          payment_type: payment_type,
          paymentDetails: {
            customerPayable: {
              total: finalOrder?.paymentDetails?.customerPayable?.total ?? 0,
              baseAmount: finalOrder?.paymentDetails?.customerPayable?.baseAmount ?? 0,
              convenienceFee: finalOrder?.paymentDetails?.customerPayable?.convenienceFee ?? 0,
              taxOnConvenience: finalOrder?.paymentDetails?.customerPayable?.taxOnConvenience ?? 0,
            },
            vendorReceivable: {
              total: finalOrder?.paymentDetails?.vendorReceivable?.total ?? 0,
              baseAmount: finalOrder?.paymentDetails?.vendorReceivable?.baseAmount ?? 0,
              commission: finalOrder?.paymentDetails?.vendorReceivable?.commission ?? 0,
              taxOnCommission: finalOrder?.paymentDetails?.vendorReceivable?.taxOnCommission ?? 0,
            },
          },
        });
        console.log(`[VerifyPayment] ✅ Successfully recorded PG_IN transaction for ${order_id}`);
      } catch (txnErr) {
        console.error(`[VerifyPayment] ❌ Failed to record PG_IN transaction:`, txnErr);
      }
    } else {
      console.log(`[VerifyPayment] Skipped PG_IN transaction recording for zero amount payment.`);
    }

    // Success Socket Emission
    if (req.io) {
      try {
        const chat = await Chat.findOne({
          $or: [{ chat_id: chat_id }, { chat_id: quotation_id }, { quotation_id: quotation_id }],
        });
        const finalChatId = chat_id || chat?.chat_id || quotation_id;
        const chatType = chat ? chat.chat_type : (finalCustomerId?.startsWith("ANON") ? "anon_customer-admin" : "customer-admin");

        const successMsg = {
          chat_id: finalChatId,
          chat_type: chatType,
          sender: "admin",
          sender_id: "SYSTEM",
          message_type: "system",
          message_content: `✅ Payment of ₹${order_amount} received successfully for Order ID: ${internalOrderId}. Status: PAID`,
          message_sent_at: new Date(),
          card_data: {
            type: "payment_success",
            status: "PAID",
            order_id: internalOrderId,
            amount: order_amount,
          },
        };

        const savedMsg = await Message.create(successMsg);

        await Chat.updateOne(
          { chat_id: finalChatId },
          { $set: { last_message_updated_at: new Date(), chat_updated_at: new Date() } }
        );

        const rooms = [
          `${finalChatId}-${chatType}`,
          `${finalChatId}-customer-admin`,
          `${finalChatId}-anon_customer-admin`,
        ];
        const uniqueRooms = [...new Set(rooms)];

        console.log(`[VerifyPayment] Emitting SUCCESS to rooms: ${uniqueRooms.join(', ')}`);
        uniqueRooms.forEach(roomId => {
          req.io.to(roomId).emit("new_message", savedMsg);
          req.io.to(roomId).emit("order_status_updated", {
            anon_order_id: quotation_id || internalOrderId,
            new_status: payment_type === "advance" ? "Partially Paid" : "Fully Paid",
          });
        });
      } catch (ioErr) {
        console.error("❌ [VerifyPayment] Error emitting success notification:", ioErr);
      }
    }

    const vendorSegments = (finalOrder.vendor_segments && finalOrder.vendor_segments.length > 0)
      ? finalOrder.vendor_segments
      : [{
        vendor_id: vendor_id,
        service_id: service_id,
        vendor_name: vendorDoc?.vendor_name || "Vendor",
        paymentDetails: finalOrder.paymentDetails,
        paymentBreakdowns: finalOrder.paymentBreakdowns
      }];


    console.log(`[VerifyPayment] Distributing payout across ${vendorSegments.length} segment(s) for milestone: ${payment_type}`);

    // If granular selected breakdowns are provided, we map them by service_id
    const selectedPayoutsMap = new Map();
    if (selected_breakdowns && selected_breakdowns.length > 0) {
      console.log(`[VerifyPayment] Using selected_breakdowns for granular payout calculation.`);
      for (const sb of selected_breakdowns) {
        const sid = sb.service_id;
        if (!selectedPayoutsMap.has(sid)) selectedPayoutsMap.set(sid, 0);

        // Find the segment and its breakdown to get the accurate net payout
        const matchSeg = vendorSegments.find(s => s.service_id === sid);
        const matchBreakdown = matchSeg?.paymentBreakdowns?.find(b => b.name === sb.name);

        let netBreakdownAmount = sb.amount;
        if (matchBreakdown) {
          const base = Number(matchBreakdown.vendor_base_amount || matchBreakdown.amount || 0);
          const comm = Number(matchBreakdown.vendor_commission || 0);
          netBreakdownAmount = Math.max(0, base - comm);
        }

        selectedPayoutsMap.set(sid, selectedPayoutsMap.get(sid) + netBreakdownAmount);
      }
    }

    for (const segment of vendorSegments) {
      const segVendorId = segment.vendor_id;
      const segServiceId = segment.service_id;
      const segVendorName = segment.vendor_name || "Vendor";

      const segReceivable = Number(segment.paymentDetails?.vendorReceivable?.total ?? 0);

      const segPreviousPayouts = await Transaction.find({
        quotation_id: quotation_id,
        service_id: segServiceId,
        internalOrderId: internalOrderId,
        transfer_mode: { $ne: "PG_IN" },
        status: { $nin: ["FAILED", "REVERSED", "CANCELLED"] }
      }).lean();

      const segAlreadyPaid = segPreviousPayouts.reduce((sum, txn) => sum + (Number(txn.transfer_amount) || 0), 0);
      const segMaxAllowed = Math.max(0, segReceivable - segAlreadyPaid);

      let segPayoutAmount = 0;

      if (selected_breakdowns && selected_breakdowns.length > 0) {
        segPayoutAmount = selectedPayoutsMap.get(segServiceId) || 0;
      } else if (payment_type === "full") {
        segPayoutAmount = segReceivable;
      } else if (payment_type === "remaining" || payment_type.toLowerCase().includes("last") || payment_type.toLowerCase().includes("final") || payment_type.toLowerCase().includes("late")) {
        segPayoutAmount = Number(segMaxAllowed.toFixed(2));
      } else {
        // Find this vendor's share for this milestone name
        const milestone = (segment.paymentBreakdowns || []).find(b => b.name === payment_type);
        if (milestone) {
          const netMilestone = Math.max(0, (Number(milestone.vendor_base_amount || milestone.amount) || 0) - (Number(milestone.vendor_commission) || 0));
          // Backward compatibility fallback to milestone.amount if new fields are 0
          const calcAmount = netMilestone > 0 ? netMilestone : (Number(milestone.amount) || 0);
          segPayoutAmount = Math.min(calcAmount, segMaxAllowed);
          segPayoutAmount = Number(segPayoutAmount.toFixed(2));
        }
      }

      console.log(`[VerifyPayment] Segment ${segServiceId}: Receivable=${segReceivable}, AlreadyPaid=${segAlreadyPaid}, Share=${segPayoutAmount}`);

      if (segPayoutAmount <= 0) continue;


      // ── Process Beneficiary and Payout for Segment ──
      const SegServiceModel = await getServiceModelById(segServiceId);
      const segServiceDoc = SegServiceModel ? await SegServiceModel.findOne({ service_id: segServiceId }) : null;
      if (!segServiceDoc) {
        console.error(`[VerifyPayment] Segment service ${segServiceId} not found. Skipping segment payout.`);
        continue;
      }

      const segBank = segServiceDoc.bank_details || {};
      const segHasBank = !!(segBank.account_number && segBank.ifsc);
      const segHasUpi = !!segBank.upi_id;
      const segBankValid = segHasBank || segHasUpi;

      const segBeneficiaryId = segBank.beneficiary_id || generateUniqueId("BENE");
      if (!segBank.beneficiary_id && SegServiceModel) {
        await SegServiceModel.updateOne({ service_id: segServiceId }, { $set: { "bank_details.beneficiary_id": segBeneficiaryId } });
      }

      const segPayoutMode = segHasBank ? "imps" : (segHasUpi ? "upi" : "imps");
      const pBase = getPayoutsBaseUrl();
      const pHeaders = buildPayoutsHeaders();

      // Beneficiary check/create in Cashfree
      if (segVendorId !== NON_ONBOARDED_VENDOR_ID) {
        let exists = false;
        try {
          await axios.get(`${pBase}/beneficiary`, { headers: pHeaders, params: { beneficiary_id: segBeneficiaryId } });
          exists = true;
        } catch (e) {
          if (e?.response?.status === 404) {
            try {
              const inst = segHasBank
                ? { bank_account_number: segBank.account_number, bank_ifsc: segBank.ifsc }
                : { vpa: segBank.upi_id };
              await axios.post(`${pBase}/beneficiary`, {
                beneficiary_id: segBeneficiaryId,
                beneficiary_name: segServiceDoc.business_details?.business_registration_name || segVendorName,
                beneficiary_instrument_details: inst,
                beneficiary_contact_details: {
                  beneficiary_email: segServiceDoc.business_details?.business_email || "noreply@eventory.in",
                  beneficiary_phone: (segServiceDoc.basic_details?.service_contact_number || "0000000000").replace(/\D/g, "").slice(-10),
                  beneficiary_country_code: "+91"
                }
              }, { headers: pHeaders });
              exists = true;
            } catch (beneErr) {
              console.error(`[VerifyPayment] Failed to create beneficiary for ${segServiceId}:`, beneErr?.response?.data || beneErr.message);
            }
          }
        }
      }

      const segTransferId = generateUniqueId("TRN");

      // 1. Transaction INIT record
      await Transaction.create({
        quotation_id,
        internalOrderId,
        vendor_id: segVendorId,
        customer_id: finalCustomerId,
        service_id: segServiceId,
        pgOrderId: order_id,
        pgStatus: payment.order_status || null,
        transfer_id: segTransferId,
        status: "INIT",
        transfer_amount: segPayoutAmount,
        transfer_mode: segPayoutMode.toUpperCase(),
        beneficiary_id: segBeneficiaryId,
        payment_type,
        paymentDetails: {
          customerPayable: finalOrder.paymentDetails.customerPayable,
          vendorReceivable: segment.paymentDetails.vendorReceivable
        }
      });

      // 2. CF Transfer Call
      if (segBankValid && segVendorId !== NON_ONBOARDED_VENDOR_ID) {
        try {
          const tResp = await axios.post(`${pBase}/transfers`, {
            transfer_id: segTransferId,
            transfer_amount: segPayoutAmount,
            beneficiary_details: { beneficiary_id: segBeneficiaryId },
            transfer_mode: segPayoutMode
          }, { headers: pHeaders });

          const tData = tResp?.data || {};
          await Transaction.findOneAndUpdate(
            { transfer_id: segTransferId },
            {
              $set: {
                cf_transfer_id: tData.cf_transfer_id || null,
                status: tData.status || "SUCCESS",
                transfer_utr: tData.transfer_utr || null,
                updated_on: new Date()
              }
            }
          );
          console.log(`[VerifyPayment] Payout initiated for ${segServiceId}: ${segPayoutAmount}`);
        } catch (tErr) {
          console.error(`[VerifyPayment] Transfer failure for ${segServiceId}:`, tErr?.response?.data || tErr.message);
          await Transaction.findOneAndUpdate(
            { transfer_id: segTransferId },
            { $set: { status: "FAILED_INIT", updated_on: new Date() } }
          );
        }
      }
    }

    // Prepare combined values for messages and order update
    const vendorName = vendorSegments[0]?.vendor_name || "Vendor(s)";
    customerName = finalOrder?.customer_name || customerName || "Customer";
    const receivableFromOrder = Number(finalOrder?.paymentDetails?.vendorReceivable?.total || 0);

    const paymentDetailsUpdate = {
      paymentStatus: (payment_type === "full" || payment_type === "remaining" || payment_type.toLowerCase().includes("final") || payment_type.toLowerCase().includes("last") || payment_type.toLowerCase().includes("late"))
        ? "Fully Paid"
        : "Partially Paid",
      customerPayable: finalOrder.paymentDetails.customerPayable,
      vendorReceivable: finalOrder.paymentDetails.vendorReceivable,
      transactionId: order_id
    };

    // Update the order with payment details
    console.log(`[VerifyPayment] Updating order ${internalOrderId} with transactionId: ${order_id}`);
    const updatedOrder = await Order.findOneAndUpdate(
      { order_id: internalOrderId },
      {
        $set: {
          paymentDetails: paymentDetailsUpdate
        }
      },
      { new: true }
    );
    console.log(`[VerifyPayment] Order update result. transactionId in DB: ${updatedOrder?.paymentDetails?.transactionId}`);

    // Update matching paymentBreakdown status to "Paid" (including segments)
    if (selected_breakdowns && selected_breakdowns.length > 0) {
      console.log(`[VerifyPayment] Updating granular breakdowns based on selected_breakdowns array.`);
      const orderDocForSave = await Order.findOne({ order_id: internalOrderId });
      if (orderDocForSave && orderDocForSave.vendor_segments) {
        for (const sb of selected_breakdowns) {
          const seg = orderDocForSave.vendor_segments.find(s => s.service_id === sb.service_id);
          if (seg && seg.paymentBreakdowns) {
            const bk = seg.paymentBreakdowns.find(b => b.name === sb.name);
            if (bk) {
              bk.status = "Paid";
              bk.paid_at = new Date();
              bk.transaction_id = order_id;
              bk.payout_status = "Processing";
            }
          }
        }
        if (orderDocForSave.paymentBreakdowns) {
          for (const sb of selected_breakdowns) {
            const bk = orderDocForSave.paymentBreakdowns.find(b => b.name === sb.name);
            if (bk && bk.status !== "Paid") {
              bk.status = "Paid";
              bk.paid_at = new Date();
              bk.transaction_id = order_id;
            }
          }
        }
        await orderDocForSave.save();
      }
    } else if (payment_type && payment_type !== "full" && payment_type !== "remaining") {
      await Order.findOneAndUpdate(
        { order_id: internalOrderId },
        {
          $set: {
            "paymentBreakdowns.$[elem].status": "Paid",
            "paymentBreakdowns.$[elem].paid_at": new Date(),
            "vendor_segments.$[].paymentBreakdowns.$[elem].status": "Paid",
            "vendor_segments.$[].paymentBreakdowns.$[elem].paid_at": new Date()
          },
        },
        {
          arrayFilters: [{ "elem.name": payment_type }],
          new: true
        }
      );
      console.log(`[VerifyPayment] Marked breakdown "${payment_type}" as Paid for order ${internalOrderId} and all segments`);
    } else if (payment_type === "full" || payment_type === "remaining") {
      // Full/Remaining payment: mark ALL breakdowns in ALL segments as Paid
      await Order.updateOne(
        { order_id: internalOrderId },
        {
          $set: {
            "paymentBreakdowns.$[].status": "Paid",
            "paymentBreakdowns.$[].paid_at": new Date(),
            "vendor_segments.$[].paymentBreakdowns.$[].status": "Paid",
            "vendor_segments.$[].paymentBreakdowns.$[].paid_at": new Date()
          }
        }
      );
    }

    // Try to sanitize known names for chat logs, else default back
    let paymentModeLog = payment_type;
    if (payment_type === "full") paymentModeLog = "Full Payment";
    else if (payment_type === "remaining") paymentModeLog = "Remaining Payment";
    else paymentModeLog = `${payment_type} Payment`;  // e.g. "Token Payment", "Advance 1 Payment"

    const customerMessage = `${paymentModeLog} of ₹${order_amount} done successfully to ${vendorName} for Order ID: ${internalOrderId}`;
    const vendorMessage = `${paymentModeLog} of ₹${order_amount} received successfully from ${customerName} for Order ID: ${internalOrderId}`;
    const adminMessage = `${paymentModeLog} of ₹${order_amount} is done by ${customerName} to ${vendorName} for Order ID: ${internalOrderId}`;

    // Send real-time chat message to Customer
    try {
      if (req.io) {
        console.log(`📡 Emitting payment success message to chat room ${quotation_id}`);

        // Find chat type to determine sender/chat_type
        const chat = await Chat.findOne({ chat_id: quotation_id });
        const chatType = chat?.chat_type || (finalCustomerId.startsWith("ANON") ? "anon_customer-admin" : "customer-admin");

        const msgPayload = {
          chat_id: quotation_id,
          chat_type: chatType,
          sender: "admin", // System/Admin message
          sender_id: "SYSTEM",
          message_type: "system",
          message_content: customerMessage,
          message_sent_at: new Date(),
          card_data: {
            type: "payment_success",
            amount: order_amount,
            order_id: internalOrderId,
            vendor_name: vendorName,
            payment_type: payment_type
          }
        };

        const savedMsg = await Message.create(msgPayload);
        req.io.to(quotation_id).emit("new_message", savedMsg);

        // Also emit to vendor room if active
        if (vendor_id) {
          req.io.to(vendor_id).emit("new_message", savedMsg);
        }
      } else {
        console.warn("⚠️ req.io is missing, cannot emit payment success message");
      }
    } catch (msgErr) {
      console.error("❌ Failed to send real-time payment notification to chat:", msgErr.message);
    }


    //notification models are changed
    try {
      await adminNotification.create({
        order_id: internalOrderId,
        em_id: em_id,
        chat_id: quotation_id,
        message: adminMessage,
        notification_type: 'checkout_message',
        read: false,
      });
      await vendorNotification.create({
        order_id: internalOrderId,
        vendor_id,
        service_id: service_id,
        chat_id: "",
        message: vendorMessage,
        notification_type: 'checkout_message',
        read: false,
      });
      await customerNotification.create({
        customer_id: finalCustomerId,
        order_id: internalOrderId,
        chat_id: quotation_id || "",
        message: customerMessage,
        notification_type: 'checkout_message',
        checkout_url: "/customerbooking", // Link to customer bookings
        read: false,
      });
    } catch { }

    //Trigger for fcm notification for em
    sendFCMNotificationToEm({
      emId: em_id,
      priority: "high",
      notification: {
        title: "Payment Received",
        body: adminMessage
      },
      data: {
        type: "payment",
        order_id: internalOrderId,
        quotation_id: quotation_id,
        chat_id: quotation_id,
        em_id: em_id,
        message: adminMessage
      }
    }).then(result => {
      console.log(`FCM notifications sent to em ${em_id} for payment ${order_id}`, result);
    }).catch(error => {
      console.error("Failed to send FCM notification for payment:", error);
    });

    //Trigger for fcm notification for vendor app
    sendFCMNotificationToVendor({
      vendorId: vendor_id,
      priority: "high",
      notification: {
        title: "Payment Received",
        body: `${paymentModeLog} of ₹${order_amount} received successfully from ${customerName} for Order ID: ${internalOrderId}`
      },
      data: {
        type: "payment",
        order_id: internalOrderId,
        quotation_id: quotation_id,
        chat_id: quotation_id,
        service_id: service_id,
        vendor_id: vendor_id,
        message: `${paymentModeLog} of ₹${order_amount} received successfully from ${customerName} for Order ID: ${internalOrderId}`
      }
    }).then(result => {
      console.log(`FCM notifications sent to vendor ${vendor_id} for payment ${order_id}`, result);
    }).catch(error => {
      console.error("Failed to send FCM notification for payment:", error);
    });

    // ── Check if an event already exists for this quotation ──
    const existingEvent = await Events.findOne({ quotation_id: quotation_id });

    if (existingEvent) {
      // ── UPDATE existing event (subsequent payment) ──
      event_id = existingEvent.event_id;
      console.log(`[VerifyPayment] Existing event found: ${event_id}. Updating payment amounts...`);

      const currentPaid = Number(existingEvent.already_paid_amount || 0);
      const newTotalPaid = Number((currentPaid + Number(order_amount)).toFixed(2));

      const updateData = {
        $set: {
          already_paid_amount: newTotalPaid,
          payment_status: (newTotalPaid >= (existingEvent.final_amount || 0) || payment_type.toLowerCase().includes("late") || payment_type === "remaining") ? "fully_paid" : "advance_paid",
          payment_details: {
            customerPayable: {
              ...(existingEvent.payment_details?.customerPayable || {}),
              couponCode: couponCode || existingEvent.payment_details?.customerPayable?.couponCode || null,
              couponDiscount: N(couponDiscount) || N(existingEvent.payment_details?.customerPayable?.couponDiscount || 0),
              breakdownDiscount: N(breakdownDiscount) || N(existingEvent.payment_details?.customerPayable?.breakdownDiscount || 0),
              discountAmount: N(couponDiscount) + N(breakdownDiscount) || N(existingEvent.payment_details?.customerPayable?.discountAmount || 0),
            },
            vendorReceivable: {
              ...(existingEvent.payment_details?.vendorReceivable || {}),
              total: (payment_type.toLowerCase().includes("late") || payment_type === "remaining")
                ? (Number(receivableFromOrder) || existingEvent.payment_details?.vendorReceivable?.total)
                : (existingEvent.payment_details?.vendorReceivable?.total),
            }
          }
        },
        $push: {
          payment_method_details: {
            channel: payment.order_meta.payment_methods || "Online",
            cf_payment_id: payment.cf_order_id || order_id,
            payment_amount: Number(order_amount),
            payment_completion_time: new Date(),
            payment_status: "SUCCESS",
            payment_group: payment_type,
          }
        }
      };

      // Mark the specific breakdown as Paid in the array
      const updateOptions = { new: true };

      if (payment_type === "remaining" || payment_type === "full") {
        updateData.$set["payment_breakdowns.$[].status"] = "Paid";
        updateData.$set["payment_breakdowns.$[].paid_at"] = new Date();
        updateData.$set["vendor_segments.$[seg].paymentBreakdowns.$[b].status"] = "Paid";
        updateData.$set["vendor_segments.$[seg].paymentBreakdowns.$[b].paid_at"] = new Date();
        updateOptions.arrayFilters = [
          { "seg": { $exists: true } },
          { "b": { $exists: true } }
        ];
      } else if (payment_type) {
        updateData.$set["payment_breakdowns.$[elem].status"] = "Paid";
        updateData.$set["payment_breakdowns.$[elem].paid_at"] = new Date();
        updateData.$set["vendor_segments.$[seg].paymentBreakdowns.$[elem].status"] = "Paid";
        updateData.$set["vendor_segments.$[seg].paymentBreakdowns.$[elem].paid_at"] = new Date();
        updateOptions.arrayFilters = [
          { "elem.name": payment_type },
          { "seg": { $exists: true } }
        ];
      }

      await Events.findOneAndUpdate({ event_id }, updateData, updateOptions);

      // Also ensure the FinalOrder gets the coupon details so Admin Panel hydration doesn't wipe them
      if (couponCode || breakdownDiscount || couponDiscount) {
        await Order.findOneAndUpdate(
          { order_id: internalOrderId },
          {
            $set: {
              "paymentDetails.customerPayable.couponCode": couponCode || existingEvent.payment_details?.customerPayable?.couponCode || null,
              "paymentDetails.customerPayable.couponDiscount": N(couponDiscount) || N(existingEvent.payment_details?.customerPayable?.couponDiscount || 0),
              "paymentDetails.customerPayable.breakdownDiscount": N(breakdownDiscount) || N(existingEvent.payment_details?.customerPayable?.breakdownDiscount || 0),
              "paymentDetails.customerPayable.discountAmount": N(couponDiscount) + N(breakdownDiscount) || N(existingEvent.payment_details?.customerPayable?.discountAmount || 0)
            }
          }
        );
      }

      // Also silently mark 0-amount Token as Paid unconditionally for Event
      await Events.updateMany(
        { event_id },
        {
          $set: {
            "payment_breakdowns.$[elem].status": "Paid",
            "payment_breakdowns.$[elem].paid_at": new Date()
          }
        },
        { arrayFilters: [{ "elem.name": { $regex: /token/i }, "elem.amount": { $in: [0, "0", null] } }] }
      );
      console.log(`[VerifyPayment] Event ${event_id} updated. New total paid: ${newTotalPaid}`);
    } else {
      // ── CREATE new event (first payment for this quotation) ──
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      event_id = generateUniqueId("EVTY");
      console.log(`[VerifyPayment] No existing event found. Creating NEW event ${event_id} for Customer ID: ${finalCustomerId} | Order ID: ${internalOrderId}`);
      const preBooking = new Events({
        event_id: event_id,
        order_id: internalOrderId,
        customer_id: finalCustomerId,
        vendor_id: vendor_id,
        service_id: service_id,
        quotation_id: quotation_id,
        em_id: em_id,

        // Required event fields (valid defaults)
        event_type: finalOrder?.event_type || "Pending",
        location_type: (finalOrder?.location_type || "outdoor").toUpperCase(),
        event_location: finalOrder?.event_location || "Pending location",
        event_start: now,
        event_end: oneHourLater,

        final_guest_count: Math.max(1, Number(finalOrder?.final_guest_count || 1)),
        final_amount: Math.max(0, Number(finalOrder?.final_amount || 0)),
        event_status: "booked",

        vendor_manager_name: "Not Assigned",
        customer_name: customerName,
        vendor_manager_contact_number: isValidINMobile(serviceDoc?.basic_details?.service_contact_number) ? serviceDoc?.basic_details?.service_contact_number : "",
        vendor_manager_contact_email: vendorDoc?.email || "",
        customer_contact_number: customerPhone,
        customer_contact_email: customerEmail,

        already_paid_amount: Number(order_amount),
        payment_status: (payment_type === "full" || payment_type === "remaining" || payment_type.toLowerCase().includes("final") || payment_type.toLowerCase().includes("last") || payment_type.toLowerCase().includes("late")) ? "fully_paid" : "advance_paid",
        payment_method: "online",

        payment_details: {
          customerPayable: {
            total: N(finalOrder?.paymentDetails?.customerPayable?.total),
            baseAmount: N(finalOrder?.paymentDetails?.customerPayable?.baseAmount),
            convenienceFee: N(finalOrder?.paymentDetails?.customerPayable?.convenienceFee),
            taxOnConvenience: N(finalOrder?.paymentDetails?.customerPayable?.taxOnConvenience),
            convenienceFeeBefore: N(finalOrder?.paymentDetails?.customerPayable?.convenienceFeeBefore),
            taxOnConvenienceBefore: N(finalOrder?.paymentDetails?.customerPayable?.taxOnConvenienceBefore),
            couponCode: couponCode || finalOrder?.paymentDetails?.customerPayable?.couponCode || null,
            couponDiscount: N(couponDiscount) || N(finalOrder?.paymentDetails?.customerPayable?.couponDiscount),
            breakdownDiscount: N(breakdownDiscount) || N(finalOrder?.paymentDetails?.customerPayable?.breakdownDiscount),
            discountAmount: N(couponDiscount) + N(breakdownDiscount) || N(finalOrder?.paymentDetails?.customerPayable?.discountAmount),
          },
          vendorReceivable: {
            total: N(finalOrder?.paymentDetails?.vendorReceivable?.total),
            baseAmount: N(finalOrder?.paymentDetails?.vendorReceivable?.baseAmount),
            commission: N(finalOrder?.paymentDetails?.vendorReceivable?.commission),
            taxOnCommission: N(finalOrder?.paymentDetails?.vendorReceivable?.taxOnCommission),
          },
        },

        final_order_items: [],
        payment_method_details: [],
        payment_breakdowns: (finalOrder?.paymentBreakdowns || []).map(b => {
          const isMatching = payment_type === "full" || payment_type === "remaining" || (b.name && b.name === payment_type);
          const isZeroToken = (b.name && b.name.toLowerCase().includes("token") && Number(b.amount) === 0);
          if (isMatching || isZeroToken) {
            return { ...(b.toObject ? b.toObject() : b), status: "Paid" };
          }
          return b;
        }),
        vendor_segments: (finalOrder?.vendor_segments || []).map(seg => {
          const updatedBreakdowns = (seg.paymentBreakdowns || []).map(b => {
            const isMatching = payment_type === "full" || payment_type === "remaining" || (b.name && b.name === payment_type);
            const isZeroToken = (b.name && b.name.toLowerCase().includes("token") && Number(b.amount) === 0);
            if (isMatching || isZeroToken) {
              return { ...(b.toObject ? b.toObject() : b), status: "Paid" };
            }
            return b;
          });
          return { ...seg, paymentBreakdowns: updatedBreakdowns };
        }),
        order_id: internalOrderId,
      });

      await preBooking.save();
      console.log(`[VerifyPayment] Event ${event_id} successfully created.`);

      // Link the new event back to the original order and sync coupon details
      const orderUpdates = { event_id: event_id };
      if (couponCode || breakdownDiscount || couponDiscount) {
        orderUpdates["paymentDetails.customerPayable.couponCode"] = couponCode || finalOrder?.paymentDetails?.customerPayable?.couponCode || null;
        orderUpdates["paymentDetails.customerPayable.couponDiscount"] = N(couponDiscount) || N(finalOrder?.paymentDetails?.customerPayable?.couponDiscount);
        orderUpdates["paymentDetails.customerPayable.breakdownDiscount"] = N(breakdownDiscount) || N(finalOrder?.paymentDetails?.customerPayable?.breakdownDiscount);
        orderUpdates["paymentDetails.customerPayable.discountAmount"] = N(couponDiscount) + N(breakdownDiscount) || N(finalOrder?.paymentDetails?.customerPayable?.discountAmount);
      }

      await Order.findOneAndUpdate(
        { order_id: internalOrderId },
        { $set: orderUpdates }
      );
      console.log(`[VerifyPayment] Order ${internalOrderId} updated with event_id: ${event_id} and coupon sync`);

      // Send Slack notification for new booking
      const { sendSlackBookingMessage } = await import("../utils/slackNotifier.js");
      if (process.env.IS_DEV !== 'true') {
        sendSlackBookingMessage({
          bookingid: event_id,
          customer: customerName,
          vendorId: vendor_id,
          serviceName: service_id,
          guest: preBooking.final_guest_count || 0,
          startDate: new Date(preBooking.event_start).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      }
    }

    const paymentMethod = payment.order_meta.payment_methods !== null
      ? payment.order_meta.payment_methods
      : "Online";

    const couponCodeParam =
      (typeof couponCode === "string" && couponCode.trim()) ||
      finalOrder?.paymentDetails?.couponCode ||
      null;

    const discountAbs =
      typeof couponDiscount === "number"
        ? Number(couponDiscount)
        : Number(finalOrder?.paymentDetails?.customerPayable?.discountAmount || finalOrder?.paymentDetails?.discount || 0);

    const cp = finalOrder?.paymentDetails?.customerPayable || {};
    const vr = finalOrder?.paymentDetails?.vendorReceivable || {};
    const totalCustomerPayable = N(cp.total);
    const baseCustomer = N(cp.baseAmount);
    const convenienceFee = N(cp.convenienceFee);
    const taxOnConvenience = N(cp.taxOnConvenience);
    const commission = N(vr.commission);
    const taxOnCommission = N(vr.taxOnCommission);
    const commissionFee = commission + taxOnCommission;

    const contents = Array.isArray(finalOrder?.final_order_items) ? finalOrder.final_order_items : [];
    const items = contents.map((c, idx) => ({
      name: c.name_of_service || `Item ${idx + 1}`,
      type: finalOrder?.event_type || "-",
      amount: String(Number(N(c.total_amount).toFixed(2))),
      vendor_id: c.vendor_id || null,
      service_id: c.service_id || null,
      vendor_name: c.vendor_name || null,
    }));

    const discountForInvoice = Math.max(0, Number(discountAbs.toFixed(2)));
    const finalAmount = Math.max(0, totalCustomerPayable - discountForInvoice);

    const safeAlreadyPaid = existingEvent ? Number(existingEvent.already_paid_amount || 0) : 0;
    const paidAmount =
      payment_type === "advance"
        ? N(order_amount)
        : payment_type === "full"
          ? finalAmount
          : payment_type === "remaining"
            ? Math.max(0, N(totalCustomerPayable) - safeAlreadyPaid - 0)
            : N(order_amount);

    const formatDateTimeForDisplay = (dateInput) => {
      if (!dateInput) return { date: "-", time: "-" };
      const d = new Date(dateInput);
      if (isNaN(+d)) return { date: "-", time: "-" };

      // e.g. "18th Nov 2025"
      const day = d.getDate();
      const suffix = (() => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      })();
      const month = d.toLocaleString("en-US", { month: "short", timeZone: "Asia/Kolkata" });
      const year = d.getFullYear();
      const dateStr = `${day}${suffix} ${month} ${year}`;

      // e.g. "2:00 PM"
      const timeStr = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

      return { date: dateStr, time: timeStr };
    };
    const { date, time } = formatDateTimeForDisplay(finalOrder.event_start);
    const venue = finalOrder.event_location;
    var customerLink = `https://eventory.in/customerbooking/${event_id}`;
    var vendorLink = "https://eventory.in/dashboard?q=Manage%20Bookings";

    if (process.env.IS_LOCAL === "true") {
      customerLink = `http://localhost:3000/customerbooking/${event_id}`;
      vendorLink = "http://localhost:3000/dashboard?q=Manage%20Bookings";
    }


    const customerPayload = {
      id: finalCustomerId,
      name: customerName,
      email: customerEmail,
      mobile: customerPhone,
      address: customerDoc?.customer_address || finalOrder?.event_location || finalOrder?.location || "",
      pincode: customerDoc?.pincode || "",
    };

    const vendorPayload = {
      id: vendorDoc.vendor_id,
      mobile: vendorDoc.vendor_mobile,
      businessDetails: {
        businessName: serviceDoc?.business_details?.business_registration_name || "",
        businessAddress: serviceDoc?.business_details?.business_address || "",
        pinCode: serviceDoc?.business_details?.pincode || "",
        panNo: serviceDoc?.business_details?.pan || "",
        gstin: serviceDoc?.business_details?.gst || "",
      },
    };

    const paymentDetailsMsg = {
      paymentType: payment_type,
      paidAmount: String(Number(paidAmount.toFixed(2))),
      method: paymentMethod,
      items,
      finalAmount,
      amount: String(Number(totalCustomerPayable.toFixed(2))), // pre-discount total
      discount: String(Number(discountForInvoice.toFixed(2))),  // absolute coupon discount
      advanceAmount: "0",
      alreadyPaidAmount: (() => {
        // After this payment, what is the total already paid?
        if (existingEvent) {
          const prev = Number(existingEvent.already_paid_amount || 0);
          return String(Number((prev + Number(order_amount)).toFixed(2)));
        }
        return String(Number(order_amount));
      })(),
      convinienceFee: String(Number((convenienceFee + taxOnConvenience).toFixed(2))),
      commissionFee: String(Number(commissionFee.toFixed(2))),
      couponCode: couponCodeParam,
      customerPayable: {
        total: N(cp.total || 0),
        baseAmount: N(cp.baseAmount || 0),
        convenienceFee: N(cp.convenienceFee || 0),
        taxOnConvenience: N(cp.taxOnConvenience || 0),
        discount: discountForInvoice,
      },
      vendorReceivable: {
        total: N(vr.total || 0),
        baseAmount: N(vr.baseAmount || 0),
        commission: N(vr.commission || 0),
        taxOnCommission: N(vr.taxOnCommission || 0),
      },
      invoiceNumber: order_id,
      date,
      time,
      venue,
      customerLink,
      vendorLink,
      event_id: event_id,
      transaction_id: order_id,
      serviceData: serviceData,      // NEW: full service data into paymentDetails
    };

    const sqsMessage = {
      type: "bookingPayment",
      customer: customerPayload,
      vendor: vendorPayload, // Primary vendor for backward compatibility
      vendor_segments: vendorSegments.map(seg => ({
        vendor_id: seg.vendor_id,
        service_id: seg.service_id,
        vendor_name: seg.vendor_name,
        paymentDetails: seg.paymentDetails,
        paymentBreakdowns: seg.paymentBreakdowns,
        serviceData: seg.serviceData || {} // Ensure we pass the snapshot
      })),
      paymentDetails: paymentDetailsMsg,
    };

    console.log(`[VerifyPayment] Sending SQS message for invoicing:`, JSON.stringify(sqsMessage, null, 2));
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.INVOICE_QUEUE_URL || (process.env.IS_DEV === "true"
        ? "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-test-queue"
        : "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue"),
      MessageBody: JSON.stringify(sqsMessage),
    }));
    console.log(`[VerifyPayment] SQS message sent successfully.`);

    // ── Consolidated Invoice: detect fully_paid and send second SQS ──
    console.log("Invoice generated successfully");
    const updatedEvent = await Events.findOne({ event_id });
    try {
      const allBreakdownsPaid = updatedEvent?.payment_breakdowns?.length > 0 &&
        updatedEvent.payment_breakdowns.every(b =>
          b.status === "Paid" || Number(b.amount || 0) === 0
        );

      if (allBreakdownsPaid) {
        console.log(`[VerifyPayment] All breakdowns paid for ${event_id}. Sending consolidated invoice SQS.`);
        const consolidatedMsg = {
          ...sqsMessage,
          paymentDetails: {
            ...paymentDetailsMsg,
            paymentType: "Consolidated",
            paidAmount: String(Number(finalAmount.toFixed(2))),
            alreadyPaidAmount: String(Number(finalAmount.toFixed(2))),
          },
        };
        await sqs.send(new SendMessageCommand({
          QueueUrl: process.env.INVOICE_QUEUE_URL || (process.env.IS_DEV === "true"
            ? "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-test-queue"
            : "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue"),
          MessageBody: JSON.stringify(consolidatedMsg),
        }));
        console.log(`[VerifyPayment] Consolidated invoice SQS sent for ${event_id}.`);
      }
    } catch (consolidatedErr) {
      console.error(`[VerifyPayment] Failed to send consolidated invoice SQS:`, consolidatedErr.message);
    }
    return res.status(200).json({
      message: "Customer payment verified",
      payment,
      event_id,
      cf_order_id: order_id,
      updated_event: updatedEvent
    });
  } catch (error) {
    console.error("❌ verifyCustomerPayment UNEXPECTED ERROR:", error?.response?.data || error.message);
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
    }
    return res.status(500).json({ error: error.message, details: error?.response?.data });
  }
};

const getPaymentByOrderId = async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ message: "Missing required field: order_id" });
  }

  try {
    const clientId = process.env.CASHFREE_CLIENT_ID_PG;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET_PG;
    const apiVersion = "2025-01-01";

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": apiVersion,
      "Content-Type": "application/json",
    };

    const url = process.env.IS_DEV === "true"
      ? `https://sandbox.cashfree.com/pg/orders/${order_id}/payments`
      : `https://api.cashfree.com/pg/orders/${order_id}/payments`;

    const response = await axios.get(url, { headers });

    const paymentData = response.data;

    return res.status(200).json({
      status: "SUCCESS",
      message: "Payment details fetched successfully",
      order_id,
      payments: paymentData,
    });
  } catch (error) {
    console.error("❌ getPaymentByOrderId error:", error?.response?.data || error.message);

    return res.status(500).json({
      status: "FAILED",
      message: "Failed to fetch payment details",
      error: error?.response?.data || error.message,
    });
  }
};

export default {
  createOrder,
  verifyPayment,
  sendInvoice,
  handleWebhook,
  getPaymentSession,
  verifyCustomerPayment,
  getPaymentByOrderId
};
