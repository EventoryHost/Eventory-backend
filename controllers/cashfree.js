import { Cashfree, CFEnvironment } from "cashfree-pg";

import generateInvoice from "../utils/generateInvoice.js";
import dotenv from "dotenv";
import { Vendor } from "../models/users.js";
import Order from "../models/finalOrders.js";
import { Transaction } from "../models/transaction.js";
import { Quotation } from "../models/quotation.js";
import { sendEmailInvoice } from "./sesController.js";
import generateUniqueId, { generatePaymentId, generateSignature } from "../utils/generateId.js";
import { sqs } from "../config/awsConfig.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import adminNotification from "../models/adminNotification.js";
import customerNotification from "../models/customerNotification.js";
import vendorNotification from "../models/vendorNotification.js";

dotenv.config();

import { sendInvoiceToWhatsApp } from "./waController.js";
import axios from "axios";
import { Customer } from "../models/customer.js";
import { Booking } from "../models/booking.js";

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

const verifyPayment = async (req, res) => {
  const { order_id, ven_id, discount, couponCode } = req.body;

  try {
    const response = await cashfree.PGFetchOrder(order_id);

    if (!response.data || response.data.length === 0) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const payment = response.data



    if (payment.order_status !== "PAID") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    console.log("Payment verified:", payment);
    const formattedDetails = {
      invoiceNumber: payment.order_id,
      invoiceDate: new Date().toLocaleDateString(),
      amount: payment.order_amount,
      method: payment.order_meta.payment_methods !== null ? payment.order_meta.payment_methods : "UPI CC",
      discount: discount || 0,
      couponCode: couponCode || null,
      id: ven_id,
    };

    const vendor = await Vendor.findOne({ id: ven_id });
    const sqsMessage = {
      type: "vendorOnboarded",
      customer: vendor,
      paymentDetails: formattedDetails,
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
      MessageBody: JSON.stringify(sqsMessage),
    }));



    return res.status(200).json({ message: "Payment verified" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

async function sendInvoice(req, res) {
  try {
    const { ven_id, amount, discount, couponCode } = req.body;
    const payment_id = generatePaymentId();

    const formattedDetails = {
      invoiceNumber: payment_id,
      invoiceDate: new Date().toLocaleDateString(),
      amount: amount,
      discount: discount,
      couponCode: couponCode || null,
      method: "None",
      id: ven_id,
    };

    const vendor = await Vendor.findOne({ id: ven_id });
    const sqsMessage = {
      type: "vendorOnboarded",
      customer: vendor,
      paymentDetails: formattedDetails,
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
      MessageBody: JSON.stringify(sqsMessage),
    }));

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
  const signature = generateSignature(payoutsClientId, publicKey, timestamp);

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

const verifyCustomerPayment = async (req, res) => {
  const { order_id, quotation_id, order_amount, payment_type } = req.body;

  try {
    const response = await cashfree.PGFetchOrder(order_id);
    if (!response.data || response.data.length === 0) {
      return res.status(400).json({ error: "Payment not found" });
    }
    const payment = response.data;
    if (payment.order_status !== "PAID") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    const finalOrder = await Order.findOne({ quotationId: quotation_id }).lean();
    if (!finalOrder) {
      return res.status(404).json({ error: "Final order not found for quotation_id" });
    }

    const qoutation = await Quotation.findOne({ id: quotation_id }).lean();
    if (!qoutation) {
      return res.status(404).json({ error: "Quotation not found for quotation_id" });
    }

    const internalOrderId = finalOrder.orderId;
    const vendorId = finalOrder.vendorId;
    const customerId = finalOrder.customerId;

    const receivableFromOrder =
      Number(
        finalOrder?.paymentDetails?.vendorReceivable?.total != null
          ? finalOrder.paymentDetails.vendorReceivable.total
          : NaN
      ) || null;

    const previousTxn = await Transaction.findOne({
      quotationId: quotation_id,
      vendorId: vendorId,
      customerId: customerId,
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

    const vendorDoc = await Vendor.findOne({ id: vendorId });
    if (!vendorDoc) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    const customerDoc = await Customer.findOne({ id: customerId });
    if (!customerDoc) {
      return res.status(404).json({ error: "Customer not found" });
    }
    if (!vendorDoc.bankDetails || vendorDoc.bankDetails.length === 0) {
      return res.status(400).json({ error: "Vendor bank details missing" });
    }

    const vendorName = vendorDoc.name;
    const customerName = customerDoc.name;

    const primaryBank = vendorDoc.bankDetails[0];
    let beneficiaryId = primaryBank.beneficiaryId;

    if (!beneficiaryId) {
      beneficiaryId = generateUniqueId("bene");
      primaryBank.beneficiaryId = beneficiaryId;
      await vendorDoc.save();
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

    const transferId = generateUniqueId("trn");

    await Transaction.create({
      quotationId: quotation_id,
      internalOrderId,
      vendorId,
      customerId,
      pgOrderId: order_id,
      pgStatus: payment.order_status || null,
      transfer_id: transferId,
      status: "INIT",
      transfer_amount: payoutAmount,
      transfer_mode: "IMPS",
      beneficiary_id: beneficiaryId,
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
      { transfer_id: transferId },
      {
        $set: {
          quotationId: quotation_id,
          internalOrderId,
          vendorId,
          customerId,
          pgOrderId: order_id,
          pgStatus: payment.order_status,
          // cf_transfer_id: transferData.cf_transfer_id || null,
          // status: transferData.status || null,
          // transfer_amount: transferData.transfer_amount ?? payoutAmount,
          // transfer_mode: transferData.transfer_mode || "IMPS",
          // transfer_utr: transferData.transfer_utr || null,
          // added_on: transferData.added_on ? new Date(transferData.added_on) : undefined,
          // updated_on: transferData.updated_on ? new Date(transferData.updated_on) : new Date(),
          beneficiary_id: beneficiaryId,
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

    const paymentTypeMap = {
      advance: "Advance Payment",
      remaining: "Remaining Payment",
      full: "Full Payment",
    };
    const paymentMode = paymentTypeMap[payment_type] || "Payment";

    const customerMessage = `${paymentMode} of ₹${order_amount} done successfully to ${vendorDoc?.businessDetails?.businessName} for Order ID: ${internalOrderId}`;
    const vendorMessage = `${paymentMode} of ₹${order_amount} received successfully from ${customerName} for Order ID: ${internalOrderId}`;
    const adminMessage = `${paymentMode} of ₹${order_amount} is done by ${customerName} to ${vendorDoc?.businessDetails?.businessName} for Order ID: ${internalOrderId}`;

    try {
      await adminNotification.create({
        orderId: internalOrderId,
        vendorId,
        customerId,
        message: adminMessage,
        quotationId: quotation_id,
        read: false,
        timestamp: new Date(),
      });
      await vendorNotification.create({
        orderId: internalOrderId,
        vendorId,
        customerId,
        message: vendorMessage,
        quotationId: quotation_id,
        type: "payment_done",
        read: false,
        timestamp: new Date(),
      });
      await customerNotification.create({
        customerId,
        vendorId,
        orderId: internalOrderId,
        message: customerMessage,
        quotationId: quotation_id,
        read: false,
        createdAt: new Date(),
      });
    } catch { }

    let bookingId;
    if (payment_type !== "remaining") {
      bookingId = generateUniqueId("book");
      const preBooking = new Booking({
        bookingid: bookingId,
        customerId: customerId,
        venId: vendorId,
        serviceId: "temp_service_id",
        type: "pending",
        location: "pending location",
        startDate: new Date(),
        endDate: new Date(),
        details: "Pending details",
        guest: 0,
        amount: "0",
        status: "Pending",
        managerName: "Not Assigned",
        customerName: "Pending Customer",
        description: "Pending description",
        paymentDetails: "{}",
        paymentStatus: "Pending",
        capacity: "0",
        serviceName: "Pending Service Name",
        serviceLocation: {},
        serviceAddress: "",
      });
      await preBooking.save();
    } else {
      bookingId = null;
    }

    const paymentMethod = payment.order_meta.payment_methods !== null
      ? payment.order_meta.payment_methods
      : "Online";

    const cp = finalOrder?.paymentDetails?.customerPayable || {};
    const vr = finalOrder?.paymentDetails?.vendorReceivable || {};

    const totalCustomerPayable = N(cp.total);
    const baseCustomer = N(cp.baseAmount);
    const convenienceFee = N(cp.convenienceFee);
    const taxOnConvenience = N(cp.taxOnConvenience);
    const commission = N(vr.commission);
    const taxOnCommission = N(vr.taxOnCommission);
    const commissionFee = commission + taxOnCommission;

    const contents = Array.isArray(finalOrder?.finalizedContents)
      ? finalOrder.finalizedContents
      : [];

    const items = contents.map((c, idx) => ({
      name: c.name || `Item ${idx + 1}`,
      type: finalOrder?.event_type || "-",
      amount: String(Number(N(c.price).toFixed(2))),
    }));

    const discount = N(cp.discount) || 0;
    const finalAmount = Math.max(0, totalCustomerPayable - discount);

    const paidAmount =
      payment_type === "advance"
        ? N(order_amount)
        : payment_type === "full"
          ? finalAmount
          : payment_type === "remaining"
            ? Math.max(0, N(totalCustomerPayable) - N(alreadyPaid) - 0)
            : N(order_amount);

    const formatDate = (dateInput) => {
      const date = new Date(dateInput);
      const day = date.getDate();
      const getDaySuffix = (d) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      };
      const dayWithSuffix = `${day}${getDaySuffix(day)}`;
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();
      return `${dayWithSuffix} ${month} ${year}`;
    };
    const date = formatDate(finalOrder.start_date);
    const time = finalOrder.time;
    const venue = qoutation.location;
    const customerLink = `https://eventory.in/customerbooking/${bookingId}`;
    const vendorLink = "https://eventory.in/dashboard?q=Manage%20Bookings";

    const customerPayload = {
      id: customerDoc.id,
      name: customerDoc.name,
      email: customerDoc.email,
      mobile: customerDoc.mobile,
      address: customerDoc.address || finalOrder?.location || "",
      pincode: customerDoc.pincode || customerDoc.pinCode || "",
    };

    const vendorPayload = {
      id: vendorDoc.id,
      name: vendorDoc.name,
      mobile: vendorDoc.mobile,
      businessDetails: {
        businessName: vendorDoc?.businessDetails?.businessName || vendorDoc?.name || "",
        businessAddress: vendorDoc?.businessDetails?.businessAddress || "",
        pinCode: vendorDoc?.businessDetails?.pinCode || "",
        panNo: vendorDoc?.businessDetails?.panNo || "",
        gstin: vendorDoc?.businessDetails?.gstin || "",
      },
    };

    const paymentDetailsMsg = {
      paymentType: payment_type,
      paidAmount: String(Number(paidAmount.toFixed(2))),
      method: paymentMethod,
      items,
      amount: String(Number(totalCustomerPayable.toFixed(2))),
      discount: String(Number((discount || 0).toFixed(2))),
      advanceAmount: String(Number((payment_type === "advance" ? order_amount : 0).toFixed(2))),
      convinienceFee: String(Number((convenienceFee + taxOnConvenience).toFixed(2))),
      commissionFee: String(Number(commissionFee.toFixed(2))),
      couponCode: finalOrder?.paymentDetails?.couponCode || null,
      customerPayable: {
        total: N(cp.total || 0),
        baseAmount: N(cp.baseAmount || 0),
        convenienceFee: N(cp.convenienceFee || 0),
        taxOnConvenience: N(cp.taxOnConvenience || 0),
        discount: N(cp.discount || 0),
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
      bookingId: bookingId,
    };

    const sqsMessage = {
      type: "bookingPayment",
      customer: customerPayload,
      vendor: vendorPayload,
      paymentDetails: paymentDetailsMsg,
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.INVOICE_QUEUE_URL || "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue",
      MessageBody: JSON.stringify(sqsMessage),
    }));

    return res.status(200).json({ message: "Customer payment verified", payment, bookingId });
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
