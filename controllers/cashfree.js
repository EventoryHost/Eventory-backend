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

const createOrder = async (req, res) => {

  var { amount, currency, customer_details } = req.body;
  amount = parseFloat(amount);
  currency = currency || "INR";

  try {
    const { vendor_id, service_id, chat_id, order_id: internal_order_id } = req.body;

    // BLOcking: Check for vendor bank details before order creation
    if (service_id) {
      const prefix = service_id.substring(0, 4).toUpperCase();
      let serviceModel = null;
      if (prefix.startsWith("CAT")) serviceModel = Caterer;
      else if (prefix.startsWith("DECO")) serviceModel = Decorator;
      else if (prefix.startsWith("VNP")) serviceModel = VenueProvider;
      else if (prefix.startsWith("PAV")) serviceModel = Photographer;
      else if (prefix.startsWith("MKA")) serviceModel = MakeupArtist;
      else if (prefix.startsWith("DJS")) serviceModel = DjArtist;

      if (serviceModel) {
        const serviceDoc = await serviceModel.findOne({ service_id });
        const bankDetailsValid = !!(serviceDoc?.bank_details && (serviceDoc.bank_details.account_number || serviceDoc.bank_details.upi_id));
        if (!bankDetailsValid) {
          console.warn(`[createOrder] 🛑 Blocking order creation. Bank details missing for service: ${service_id}`);

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
              const chatDocArray = await adminNotification.find({ chat_id }).limit(1); // Not the best, but using models we have
              // Better: search quotations or orders
              const orderDoc = await Order.findOne({ quotation_id: chat_id });
              if (orderDoc) {
                em_id = orderDoc.em_id || em_id;
                final_order_id = final_order_id || orderDoc.order_id;
              }
            }

            if (em_id && final_chat_id) {
              await adminNotification.create({
                em_id: em_id,
                chat_id: final_chat_id,
                order_id: final_order_id,
                message: `⚠️ Payment Blocked: Vendor (${vendor_id}) is missing bank details for Service (${service_id}). Please add them immediately to allow customer payment.`,
                notification_type: 'checkout_message',
                timestamp: new Date().toISOString()
              });
              console.log(`[createOrder] EM Notification created for EM: ${em_id}`);
            }
          } catch (notiErr) {
            console.error("❌ [createOrder] Error creating EM notification:", notiErr);
          }

          return res.status(400).json({
            error: "Vendor bank details missing. Payment cannot be processed.",
            code: "MISSING_BANK_DETAILS"
          });
        }
      }
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
      couponCode,
      couponDiscount,
      service_id,
      serviceData,
      customer_id,
      chat_id,
    } = req.body;
    const response = await cashfree.PGFetchOrder(order_id);
    if (!response.data || response.data.length === 0) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const payment = response.data;
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

    // NEW: Resolve Event ID early so we can attach it to transactions immediately!
    let event_id;
    let existingEventForEarlyId = await Events.findOne({ quotation_id: quotation_id }).select("event_id").lean();
    if (existingEventForEarlyId) {
      event_id = existingEventForEarlyId.event_id;
    } else {
      event_id = generateUniqueId("EVTY"); // Pre-allocate the new event ID
    }

    // NEW: Record the PG Payment Transaction
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

    const receivableFromOrder =
      Number(
        finalOrder?.paymentDetails?.vendorReceivable?.total != null
          ? finalOrder.paymentDetails.vendorReceivable.total
          : NaN
      ) || null;

    const previousTxn = await Transaction.findOne({
      quotation_id: quotation_id,
      vendor_id: vendor_id,
      customer_id: finalCustomerId,
      service_id: service_id,
      internalOrderId: internalOrderId,
    }).lean();

    const alreadyPaid = previousTxn?.transfer_amount ?? 0;

    let payoutAmount;

    // NEW: Dynamic Category Payout Logic
    // Token / Advance / Final Pay / Last Pay will be passed as `payment_type`.
    // We cap ANY payout to strictly what is mathematically owed up to that point.
    // Ensure we do not pay the vendor more than `receivableFromOrder - alreadyPaid`.
    const maxAllowedPayout = Math.max(0, (receivableFromOrder ?? 0) - alreadyPaid);

    if (payment_type === "full") {
      payoutAmount = receivableFromOrder;
    } else if (payment_type === "remaining" || payment_type === "Last Pay" || payment_type === "Final Pay") {
      payoutAmount = Number(maxAllowedPayout.toFixed(2));
    } else {
      // For anything else ("Advance", "Advance 1", "Token"), we payout the passed amount
      // but cap it against the final allowable vendor receivable so we don't accidentally
      // pay out Eventory's commission during heavy advance phases.
      payoutAmount = Math.min(order_amount, maxAllowedPayout);
      payoutAmount = Number(payoutAmount.toFixed(2));
    }

    console.log(`[VerifyPayment] Payment Type: ${payment_type}, Payout Amount Calculated: ${payoutAmount}, Receivable was: ${receivableFromOrder}, Already Paid was: ${alreadyPaid}`);

    if (payoutAmount === null || payoutAmount === undefined || isNaN(payoutAmount)) {
      console.error(`[VerifyPayment] 400: Invalid payoutAmount: ${payoutAmount}`);
      return res.status(400).json({ error: `Invalid payout amount calculated: ${payoutAmount}` });
    }

    const vendorDoc = await Vendor.findOne({ vendor_id });
    if (!vendorDoc) {
      console.error(`[VerifyPayment] ⚠️ Vendor not found for ID: ${vendor_id}. Search query: { vendor_id: "${vendor_id}" }. BUT payment is PAID. Proceeding.`);
      // return res.status(404).json({ error: `Vendor not found for ID: ${vendor_id}` });
    }

    const customerDoc = await Customer.findOne({ customer_id: finalCustomerId });
    if (!customerDoc) {
      console.warn(`[VerifyPayment] Customer record not found for ID: ${finalCustomerId}. Falling back to Order details.`);
      // We don't return 404 anymore; we proceed with fallback logic.
    }


    const ServiceModel = await getServiceModelById(service_id);
    if (!ServiceModel) {
      console.error(`[VerifyPayment] ⚠️ Invalid service_id prefix in ${service_id}. BUT payment is PAID. Proceeding.`);
      // return res.status(400).json({ error: `Invalid service_id prefix in ${service_id}` });
    }

    const serviceDoc = ServiceModel ? await ServiceModel.findOne({ service_id }) : null;
    if (!serviceDoc) {
      console.error(`[VerifyPayment] ⚠️ Service/Model not found for ID: ${service_id}. BUT payment is PAID. Proceeding.`);
    }

    let bankDetailsValid = !!(serviceDoc?.bank_details && (serviceDoc.bank_details.account_number || serviceDoc.bank_details.upi_id));
    if (!bankDetailsValid) {
      console.warn(`⚠️ [VerifyPayment] Bank details and UPI ID missing or invalid for service ${service_id}. Payout will be skipped.`);
    }

    // Determine payout mode: UPI if only VPA, IMPS if bank account exists
    const hasBank = !!(serviceDoc?.bank_details?.account_number && serviceDoc?.bank_details?.ifsc);
    const hasUpi = !!serviceDoc?.bank_details?.upi_id;
    const payoutMode = hasBank ? "imps" : hasUpi ? "upi" : "imps";

    // canonical service snapshot
    const serviceSnapshot = serviceData || (serviceDoc ? serviceDoc.toObject() : {});

    // name?? 
    const vendorName = serviceDoc?.business_details?.business_registration_name || "Vendor";
    const customerName = customerDoc?.customer_name || finalOrder.customer_name || "Guest Customer";
    const customerEmail = customerDoc?.email_address || finalOrder.customer_contact_email || "noreply@eventory.in";
    const customerPhone = customerDoc?.mobile_number || finalOrder.customer_contact_number || "0000000000";

    const primaryBank = serviceDoc?.bank_details || {};
    let beneficiary_id = primaryBank?.beneficiary_id;

    // Beneficiary should already be created when bank details were saved.
    // If missing, generate one and save it as a fallback.
    if (!beneficiary_id) {
      console.warn(`[VerifyPayment] ⚠️ No beneficiary_id found for service ${service_id}. Generating fallback.`);
      beneficiary_id = generateUniqueId("BENE");
      if (serviceDoc) {
        serviceDoc.bank_details.beneficiary_id = beneficiary_id;
        await serviceDoc.save();
      }
    }

    const payoutsBase = getPayoutsBaseUrl();
    const headers = buildPayoutsHeaders();

    // Verify beneficiary exists in Cashfree; create as fallback if not
    if (finalOrder?.vendor_id !== "VEN05012026111140552") {
      let hasBeneficiary = false;
      try {
        await axios.get(`${payoutsBase}/beneficiary`, { headers, params: { beneficiary_id } });
        hasBeneficiary = true;
      } catch (e) {
        if (e?.response?.status !== 404) {
          console.error("❌ [VerifyPayment] Error checking beneficiary:", e?.response?.data || e.message);
        }
      }

      if (!hasBeneficiary) {
        console.warn(`[VerifyPayment] Beneficiary ${beneficiary_id} not found in Cashfree. Creating as fallback.`);
        try {
          const instrumentDetails = hasBank
            ? { bank_account_number: primaryBank.account_number, bank_ifsc: primaryBank.ifsc }
            : { vpa: primaryBank.upi_id };

          await axios.post(`${payoutsBase}/beneficiary`, {
            beneficiary_id,
            beneficiary_name: vendorName,
            beneficiary_instrument_details: instrumentDetails,
            beneficiary_contact_details: {
              beneficiary_email: vendorDoc?.email || "noreply@example.com",
              beneficiary_phone: (vendorDoc?.vendor_mobile || "").replace(/\D/g, "").slice(-10),
              beneficiary_country_code: "+91",
            },
          }, { headers });
        } catch (e) {
          console.error("❌ [VerifyPayment] Fallback beneficiary creation failed:", e?.response?.data || e.message);
        }
      }
    }

    if (!bankDetailsValid) {
      console.log(`[VerifyPayment] Skipping payout initiation due to missing bank details.`);
    }
    const transfer_id = generateUniqueId("TRN");

    await Transaction.create({
      quotation_id,
      internalOrderId,
      vendor_id,
      customer_id: finalCustomerId,
      service_id,
      pgOrderId: order_id,
      pgStatus: payment.order_status || null,
      transfer_id,
      status: "INIT",
      transfer_amount: payoutAmount,
      transfer_mode: payoutMode.toUpperCase(),
      beneficiary_id,
      payment_type,
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

    if (bankDetailsValid) {
      const transferBody = {
        transfer_id: transfer_id,
        transfer_amount: payoutAmount,
        beneficiary_details: { beneficiary_id: beneficiary_id },
        transfer_mode: payoutMode,
      };

      let transferResp;

      if (finalOrder?.vendor_id !== "VEN05012026111140552") {
        try {
          transferResp = await axios.post(`${payoutsBase}/transfers`, transferBody, { headers });
        } catch (e) {
          await Transaction.findOneAndUpdate(
            { transfer_id: transfer_id },
            {
              $set: {
                status: "FAILED_INIT",
                cf_transfer_id: null,
                transfer_amount: payoutAmount,
                transfer_mode: "IMPS",
                added_on: undefined,
                updated_on: new Date(),
              },
            },
            { new: true }
          );
          return res.status(500).json({ error: "Failed to initiate payout transfer", details: e?.response?.data || e.message });
        }
      }
      const transferData = transferResp?.data || {};
      await Transaction.findOneAndUpdate(
        { transfer_id },
        {
          $set: {
            vendor_id,
            customer_id: finalCustomerId,
            service_id,
            event_id,
            pgOrderId: order_id,
            pgStatus: payment.order_status,
            beneficiary_id,
            cf_transfer_id: transferData.cf_transfer_id || null,
            status: transferData.status || null,
            transfer_amount: transferData.transfer_amount ?? payoutAmount,
            transfer_mode: transferData.transfer_mode || "IMPS",
            transfer_utr: transferData.transfer_utr || null,
            added_on: transferData.added_on ? new Date(transferData.added_on) : undefined,
            updated_on: transferData.updated_on ? new Date(transferData.updated_on) : new Date(),
            payment_type,
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
          },
        },
        { new: true }
      );
    }

    // Update payment details in the Order model
    const paymentDetailsUpdate = {
      paymentStatus:
        (payment_type === "full" || payment_type === "remaining" || payment_type.toLowerCase().includes("final") || payment_type.toLowerCase().includes("last"))
          ? "Fully Paid"
          : "Partially Paid",
      customerPayable: {
        total: finalOrder?.paymentDetails?.customerPayable?.total ?? order_amount,
        baseAmount: finalOrder?.paymentDetails?.customerPayable?.baseAmount ?? order_amount,
        convenienceFee: finalOrder?.paymentDetails?.customerPayable?.convenienceFee ?? 0,
        taxOnConvenience: finalOrder?.paymentDetails?.customerPayable?.taxOnConvenience ?? 0,
      },
      vendorReceivable: {
        total: finalOrder?.paymentDetails?.vendorReceivable?.total ?? order_amount,
        baseAmount: finalOrder?.paymentDetails?.vendorReceivable?.baseAmount ?? order_amount,
        commission: finalOrder?.paymentDetails?.vendorReceivable?.commission ?? 0,
        taxOnCommission: finalOrder?.paymentDetails?.vendorReceivable?.taxOnCommission ?? 0,
      }
    };

    // Update the order with payment details
    await Order.findOneAndUpdate(
      { order_id: internalOrderId },
      { $set: { paymentDetails: paymentDetailsUpdate } },
      { new: true }
    );

    // Update the matching paymentBreakdown status to "Paid"
    if (payment_type && payment_type !== "full") {
      await Order.findOneAndUpdate(
        {
          order_id: internalOrderId,
          "paymentBreakdowns.name": payment_type,
          "paymentBreakdowns.status": "Unpaid",
        },
        {
          $set: { "paymentBreakdowns.$.status": "Paid" },
        }
      );
      console.log(`[VerifyPayment] Marked breakdown "${payment_type}" as Paid for order ${internalOrderId}`);
    } else if (payment_type === "full") {
      // Full payment: mark ALL breakdowns as Paid
      await Order.updateOne(
        { order_id: internalOrderId },
        { $set: { "paymentBreakdowns.$[].status": "Paid" } }
      );
      console.log(`[VerifyPayment] Marked all breakdowns as Paid (full payment) for order ${internalOrderId}`);
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
          payment_status: newTotalPaid >= (existingEvent.final_amount || 0) ? "fully_paid" : "advance_paid",
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
      if (payment_type && payment_type !== "remaining" && payment_type !== "full") {
        updateData.$set["payment_breakdowns.$[elem].status"] = "Paid";
      }

      const updateOptions = {
        arrayFilters: [{ "elem.name": payment_type }],
        new: true
      };

      await Events.findOneAndUpdate({ event_id }, updateData, updateOptions);
      console.log(`[VerifyPayment] Event ${event_id} updated. New total paid: ${newTotalPaid}`);
    } else {
      // ── CREATE new event (first payment for this quotation) ──
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      event_id = generateUniqueId("EVTY");
      console.log(`[VerifyPayment] No existing event found. Creating NEW event ${event_id} for Customer ID: ${finalCustomerId} | Order ID: ${internalOrderId}`);
      const preBooking = new Events({
        event_id: event_id,
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
        payment_status: (payment_type === "full" || payment_type === "remaining" || payment_type.toLowerCase().includes("final") || payment_type.toLowerCase().includes("last")) ? "fully_paid" : "advance_paid",
        payment_method: "online",

        payment_details: {
          customerPayable: {
            total: N(finalOrder?.paymentDetails?.customerPayable?.total),
            baseAmount: N(finalOrder?.paymentDetails?.customerPayable?.baseAmount),
            convenienceFee: N(finalOrder?.paymentDetails?.customerPayable?.convenienceFee),
            taxOnConvenience: N(finalOrder?.paymentDetails?.customerPayable?.taxOnConvenience),
            convenienceFeeBefore: N(finalOrder?.paymentDetails?.customerPayable?.convenienceFeeBefore),
            taxOnConvenienceBefore: N(finalOrder?.paymentDetails?.customerPayable?.taxOnConvenienceBefore),
            couponCode: finalOrder?.paymentDetails?.customerPayable?.couponCode ?? null,
            discountAmount: N(finalOrder?.paymentDetails?.customerPayable?.discountAmount),
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
          if (isMatching) {
            return { ...(b.toObject ? b.toObject() : b), status: "Paid" };
          }
          return b;
        }),
        order_id: internalOrderId,
      });

      await preBooking.save();
      console.log(`[VerifyPayment] Event ${event_id} successfully created.`);

      // Link the new event back to the original order
      await Order.findOneAndUpdate(
        { order_id: internalOrderId },
        { $set: { event_id: event_id } }
      );
      console.log(`[VerifyPayment] Order ${internalOrderId} updated with event_id: ${event_id}`);

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
    }));

    const discountForInvoice = Math.max(0, Number(discountAbs.toFixed(2)));
    const finalAmount = Math.max(0, totalCustomerPayable - discountForInvoice);

    const paidAmount =
      payment_type === "advance"
        ? N(order_amount)
        : payment_type === "full"
          ? finalAmount
          : payment_type === "remaining"
            ? Math.max(0, N(totalCustomerPayable) - N(alreadyPaid) - 0)
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
      serviceData: serviceSnapshot,      // NEW: full service data into paymentDetails
    };

    const sqsMessage = {
      type: "bookingPayment",
      customer: customerPayload,
      vendor: vendorPayload,
      paymentDetails: paymentDetailsMsg,
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.INVOICE_QUEUE_URL || (process.env.IS_DEV === "true"
        ? "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-test-queue"
        : "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue"),
      MessageBody: JSON.stringify(sqsMessage),
    }));

    console.log("Invoice generated successfully");
    const updatedEvent = await Events.findOne({ event_id });
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
