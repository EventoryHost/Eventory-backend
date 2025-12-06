import { Cashfree, CFEnvironment } from "cashfree-pg";

import generateInvoice from "../utils/generateInvoice.js";
import dotenv from "dotenv";
import { Vendor } from "../models/vendor.js";
import Order from "../models/orders.js";
import { Transaction } from "../models/transactions.js";
import Quotation from "../models/quotations.js";
import { sendEmailInvoice } from "./sesController.js";
import { sendFCMNotificationToVendor } from "../utils/firebaseNotificationUtils.js";
import generateUniqueId, { generatePaymentId, generateSignature } from "../utils/generateId.js";
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


dotenv.config();

import { sendInvoiceToWhatsApp } from "./waController.js";
import axios from "axios";
import { Customer } from "../models/customer.js";
import { Events } from "../models/events.js";

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
    const request = {
      order_id: generatePaymentId(),
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: customer_details.id,
        customer_phone: customer_details.phone,
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

    const sqsMessage = {
      type: "vendorOnboarded",
      customer: vendor,
      paymentDetails: formattedDetails,
    };

    await sqs.send(
      new SendMessageCommand({
        QueueUrl:
          "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
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
        QueueUrl:
          "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
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

function buildPayoutsHeaders() {
  const payoutsClientId = process.env.CASHFREE_CLIENT_ID_PAYOUTS; // set in env
  const payoutsSecret = process.env.CASHFREE_CLIENT_SECRET_PAYOUTS; // set in env
  const rawKey = process.env.CASHFREE_PUBLIC_KEY_PAYOUTS.replace(/\n/g, "\n").trim();
  const publicKey = `-----BEGIN PUBLIC KEY-----\n${rawKey}\n-----END PUBLIC KEY-----`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(
    clientId,
    process.env.CASHFREE_PUBLIC_KEY,
    timestamp
  );  

  return {
    "Content-Type": "application/json",
    "x-api-version": "2024-01-01",
    "x-client-id": payoutsClientId,
    "x-client-secret": payoutsSecret,
    "x-cf-signature": signature, // header name per your 2FA setup
    "x-cf-timestamp": String(timestamp), // send timestamp used for signature
  };
}

const N = (v) => Number(v ?? 0)

// Helper function to get the service model by service_id
const getServiceModelById = (service_id) => {
  if (!service_id || typeof service_id !== "string") return null;

  if (service_id.startsWith("CAT")) return Caterer;
  if (service_id.startsWith("DECO")) return Decorator;
  if (service_id.startsWith("PAV")) return Photographer;
  if (service_id.startsWith("VNP")) return VenueProvider;
  if (service_id.startsWith("MKA")) return MakeupArtist;
  if (service_id.startsWith("DJS")) return DjArtist;

  return null;
};

const verifyCustomerPayment = async (req, res) => {
  const {
    order_id,
    quotation_id,
    order_amount,
    payment_type,
    couponCode,
    couponDiscount,
    service_id,
    serviceData,             // NEW from frontend (optional)
  } = req.body;

  try {
    const response = await cashfree.PGFetchOrder(order_id);
    if (!response.data || response.data.length === 0) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const payment = response.data;
    if (payment.order_status !== "PAID") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    // Fetch the final order to get required IDs
    const finalOrder = await Order.findOne({ quotation_id: quotation_id }).lean();
    if (!finalOrder) {
      return res.status(404).json({ error: "Final order not found for quotation_id" });
    }

    const internalOrderId = finalOrder.order_id;
    const vendor_id = finalOrder.vendor_id;
    const customer_id = finalOrder.customer_id;
    const em_id = finalOrder.em_id;

    const receivableFromOrder =
      Number(
        finalOrder?.paymentDetails?.vendorReceivable?.total != null
          ? finalOrder.paymentDetails.vendorReceivable.total
          : NaN
      ) || null;

    const previousTxn = await Transaction.findOne({
      quotation_id: quotation_id,
      vendor_id: vendor_id,
      customer_id: customer_id,
      service_id: service_id,
      internalOrderId: internalOrderId,
    }).lean();

    const alreadyPaid = previousTxn?.transfer_amount ?? 0;

    let payoutAmount;
    if (payment_type === "advance") {
      payoutAmount = order_amount;
    } else if (payment_type === "full") {
      payoutAmount = receivableFromOrder;
    } else if (payment_type === "remaining") {
      payoutAmount = Number(((receivableFromOrder ?? 0) - alreadyPaid).toFixed(2));
      if (payoutAmount < 0) payoutAmount = 0;
    }

    const vendorDoc = await Vendor.findOne({ vendor_id });
    if (!vendorDoc) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    const customerDoc = await Customer.findOne({ customer_id });
    if (!customerDoc) {
      return res.status(404).json({ error: "Customer not found" });
    }
    //Now bank account resides in the respective service collection.
    // if (!vendorDoc.bankDetails || vendorDoc.bankDetails.length === 0) {
    //   return res.status(400).json({ error: "Vendor bank details missing" });
    // }

    const ServiceModel = getServiceModelById(service_id);
    if (!ServiceModel) {
      return res.status(400).json({ error: `Invalid service_id prefix in ${service_id}` });
    }

    const serviceDoc = await ServiceModel.findOne({ service_id });
    if (!serviceDoc) {
      return res.status(404).json({ error: `No service found for service_id: ${service_id}` });
    }

    if (!serviceDoc.bank_details || Object.keys(serviceDoc.bank_details).length === 0) {
      return res.status(400).json({ error: "Bank details missing for this service" });
    }

    // canonical service snapshot we will put into SQS
    const serviceSnapshot = serviceData || serviceDoc.toObject();

    // name?? 
    const vendorName = serviceDoc.business_details.business_registration_name;
    const customerName = customerDoc.customer_name;

    const primaryBank = serviceDoc.bank_details;
    let beneficiary_id = primaryBank.beneficiary_id;

    if (!beneficiary_id) {
      beneficiary_id = generateUniqueId("BENE");
      primaryBank.beneficiary_id = beneficiary_id;
      await serviceDoc.save();
    }

    // const payoutsBase = process.env.IS_DEV === "true"
    //   ? "https://sandbox.cashfree.com/payout"
    //   : "https://api.cashfree.com/payout";
    // const headers = buildPayoutsHeaders();

    // const getBeneUrl = `${payoutsBase}/beneficiary`;
    // let hasBeneficiary = false;
    // try {
    //   await axios.get(getBeneUrl, { headers, params: { beneficiary_id: beneficiaryId } });
    //   hasBeneficiary = true;
    // } catch (e) {
    //   const status = e?.response?.status;
    //   if (status !== 404) {
    //     return res.status(500).json({ error: "Failed to fetch beneficiary", details: e?.response?.data || e.message });
    //   }
    // }

    // if (!hasBeneficiary) {
    //   const createBody = {
    //     beneficiary_id: beneficiaryId,
    //     beneficiary_name: primaryBank.accountName,
    //     beneficiary_instrument_details: {
    //       bank_account_number: primaryBank.accountNo,
    //       bank_ifsc: primaryBank.ifscCode,
    //     },
    //     beneficiary_contact_details: {
    //       beneficiary_email: vendorDoc.email || "noreply@example.com",
    //       beneficiary_phone: (vendorDoc.mobile || "").replace(/\s+/g, ""),
    //       beneficiary_country_code: "+91",
    //     },
    //   };
    //   try {
    //     await axios.post(`${payoutsBase}/beneficiary`, createBody, { headers });
    //   } catch (e) {
    //     return res.status(500).json({ error: "Failed to create beneficiary", details: e?.response?.data || e.message });
    //   }
    // }

    const transfer_id = generateUniqueId("TRN");

    await Transaction.create({
      quotation_id,
      internalOrderId,
      vendor_id,
      customer_id,
      service_id,                            // CRITICAL: was missing
      pgOrderId: order_id,                   // FIX: use pgOrderId (camelCase)
      pgStatus: payment.order_status || null, // FIX: match schema
      transfer_id,
      status: "INIT",
      transfer_amount: payoutAmount,
      transfer_mode: "IMPS",
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

    // const transferBody = {
    //   transfer_id: transferId,
    //   transfer_amount: payoutAmount,
    //   beneficiary_details: { beneficiary_id: beneficiaryId },
    // };

    // let transferResp;
    // try {
    //   transferResp = await axios.post(`${payoutsBase}/transfers`, transferBody, { headers });
    // } catch (e) {
    //   await Transaction.findOneAndUpdate(
    //     { transfer_id: transferId },
    //     {
    //       $set: {
    //         status: "FAILED_INIT",
    //         cf_transfer_id: null,
    //         transfer_amount: payoutAmount,
    //         transfer_mode: "IMPS",
    //         added_on: undefined,
    //         updated_on: new Date(),
    //       },
    //     },
    //     { new: true }
    //   );
    //   return res.status(500).json({ error: "Failed to initiate payout transfer", details: e?.response?.data || e.message });
    // }

    // const transferData = transferResp?.data || {};
    await Transaction.findOneAndUpdate(
      { transfer_id },
      {
        $set: {
          quotation_id,
          internalOrderId,
          vendor_id,
          customer_id,
          service_id,                         // CRITICAL: ensure it's present
          pgOrderId: order_id,                // FIX: camelCase
          pgStatus: payment.order_status,     // FIX: camelCase
          beneficiary_id,
          // cf_transfer_id: transferData.cf_transfer_id || null,
          // status: transferData.status || null,
          // transfer_amount: transferData.transfer_amount ?? payoutAmount,
          // transfer_mode: transferData.transfer_mode || "IMPS",
          // transfer_utr: transferData.transfer_utr || null,
          // added_on: transferData.added_on ? new Date(transferData.added_on) : undefined,
          // updated_on: transferData.updated_on ? new Date(transferData.updated_on) : new Date(),
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

    // Update payment details in the Order model
    const paymentDetailsUpdate = {
      paymentStatus:
        payment_type === "full"
          ? "Fully Paid"
          : payment_type === "advance"
            ? "Partially Paid"
            : payment_type === "remaining"
              ? "Fully Paid"
              : "Unknown",
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

    const paymentTypeMap = {
      advance: "Advance Payment",
      remaining: "Remaining Payment",
      full: "Full Payment",
    };
    const paymentMode = paymentTypeMap[payment_type] || "Payment";

    const customerMessage = `${paymentMode} of ₹${order_amount} done successfully to ${vendorName} for Order ID: ${internalOrderId}`;
    const vendorMessage = `${paymentMode} of ₹${order_amount} received successfully from ${customerName} for Order ID: ${internalOrderId}`;
    const adminMessage = `${paymentMode} of ₹${order_amount} is done by ${customerName} to ${vendorName} for Order ID: ${internalOrderId}`;


    //notification models are changed
    try {
      await adminNotification.create({
        order_id: internalOrderId,
        em_id: em_id,
        chat_id: quotation_id,
        message: adminMessage,
        read: false,
      });
      await vendorNotification.create({
        order_id: internalOrderId,
        vendor_id,
        service_id: service_id,
        chat_id: quotation_id,
        message: vendorMessage,
        notification_type: 'checkout_message',
        read: false,
      });
      await customerNotification.create({
        customer_id,
        order_id: internalOrderId,
        chat_id: quotation_id,
        message: customerMessage,
        notification_type: 'checkout_message',
        read: false,
      });
    } catch { }

    //Trigger for fcm notification for vendor app
    sendFCMNotificationToVendor({
      vendorId: vendor_id,
      priority: "high",
      notification: {
        title: "Payment Received",
        body: `${paymentMode} of ₹${order_amount} received successfully from ${customerName} for Order ID: ${internalOrderId}`
      },
      data: {
        type: "payment",
        order_id: internalOrderId,
        quotation_id: quotation_id,
        chat_id: quotation_id,
        service_id: service_id,
        vendor_id: vendor_id,
        message: `${paymentMode} of ₹${order_amount} received successfully from ${customerName} for Order ID: ${internalOrderId}`
      }
    }).then(result => {
      console.log(`FCM notifications sent to vendor ${vendor_id} for payment ${order_id}`, result);
    }).catch(error => {
      console.error("Failed to send FCM notification for payment:", error);
    });

    let event_id;
    if (payment_type !== "remaining") {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      event_id = generateUniqueId("EVTY");
      const preBooking = new Events({
        event_id: event_id,
        customer_id: customer_id,
        vendor_id: vendor_id,
        service_id: service_id || "TEMP_SERVICE_ID", // use real when you have it
        quotation_id: quotation_id,
        em_id: em_id,

        // Required event fields (valid defaults)
        event_type: finalOrder?.event_type || "Pending",
        location_type: finalOrder?.location_type.toUpperCase(), // valid enum
        event_location: finalOrder?.event_location || "Pending location",
        event_start: now,
        event_end: oneHourLater, // strictly after start

        final_guest_count: Math.max(1, Number(finalOrder?.final_guest_count || 1)),
        final_amount: Math.max(0, Number(finalOrder?.final_amount || 0)),
        event_status: "booked", // valid enum

        vendor_manager_name: "Not Assigned",
        customer_name: customerDoc?.customer_name || "Pending Customer",

        // Contacts (optional but keep sane)
        vendor_manager_contact_number: isValidINMobile(serviceDoc?.basic_details?.service_contact_number) ? serviceDoc?.basic_details?.service_contact_number : "",
        vendor_manager_contact_email: vendorDoc?.email || "",
        customer_contact_number: isValidINMobile(customerDoc?.contact_number) ? customerDoc?.contact_number : "",
        customer_contact_email: customerDoc?.email_address || "",

        // Payment status for advance flow
        already_paid_amount: payment_type === "advance" ? Number(order_amount) : 0,
        advance_amount_paid: payment_type === "advance" ? Number(order_amount) : 0,
        payment_status: "advance_paid",
        payment_method: "online",

        // Totals blocks empty for now; real values set later by createBooking
        payment_details: {
          customerPayable: {
            total: 0,
            baseAmount: 0,
            convenienceFee: 0,
            taxOnConvenience: 0,
            convenienceFeeBefore: 0,
            taxOnConvenienceBefore: 0,
            couponCode: null,
            discountAmount: 0
          },
          vendorReceivable: {
            total: 0,
            baseAmount: 0,
            commission: 0,
            taxOnCommission: 0
          }
        },

        // Minimal items; you can also leave an empty array
        final_order_items: [],
        payment_method_details: [],
      });

      await preBooking.save();
    } else {
      event_id = null;
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
        : Number(finalOrder?.paymentDetails?.discount || 0);

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
    const customerLink = `https://eventory.in/customerbookingnew/${event_id}`;
    const vendorLink = "https://eventory.in/dashboard?q=Manage%20Bookings";

    const customerPayload = {
      id: customerDoc.customer_id,
      name: customerDoc.customer_name,
      email: customerDoc.email_address,
      mobile: customerDoc.contact_number,
      address: customerDoc.customer_address || finalOrder?.location || "",
      pincode: customerDoc.pincode || "",
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
      amount: String(Number(totalCustomerPayable.toFixed(2))), // pre-discount total
      discount: String(Number(discountForInvoice.toFixed(2))),  // absolute coupon discount
      advanceAmount: String(Number((payment_type === "advance" ? order_amount : 0).toFixed(2))),
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
      QueueUrl: process.env.INVOICE_QUEUE_URL
        || "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
      MessageBody: JSON.stringify(sqsMessage),
    }));

    return res.status(200).json({ message: "Customer payment verified", payment, event_id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
