import { Events } from "../models/events.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decorator.js";
import VenueProvider from "../models/venueProvider.js";
import Photographer from "../models/photographerVideographer.js";
import MakeupArtist from "../models/makeupArtist.js";
import generateUniqueId from "../utils/generateId.js";
import { Calendar } from "../models/calendar.js";
import { sendSlackBookingMessage } from "../utils/slackNotifier.js";
import Quotations from "../models/quotations.js";
import Order from "../models/orders.js";
import AnonCustomerOrder from "../models/anonCustomerOrder.js";
import Message from "../models/message2.js";

const toUpperEnum = (v) => (typeof v === "string" ? v.trim().toUpperCase() : v);
const toISODate = (v) => (v ? new Date(v) : null);
const asNumber = (v, d = 0) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : d;
};
const nonEmptyArray = (a) => (Array.isArray(a) ? a.filter(Boolean) : []);

export const createBooking = async (req, res) => {
  try {
    console.log("[BOOKING_DEBUG] createBooking triggered with body:", JSON.stringify(req.body));
    // Extract raw body
    const body = req.body || {};

    // Allow both camelCase and snake_case from client
    const {
      event_id,                    // optional: if present, update existing pending EVTY
      customer_id,
      vendor_id,
      service_id,
      quotation_id,
      order_id,
      em_id,

      event_type,
      location_type,               // expects INDOOR | OUTDOOR (any case)
      event_location,
      event_start,
      event_end,

      final_guest_count,
      specific_terms,              // string[] optional

      final_amount,

      event_status,                // booked|upcoming|ongoing|completed|cancelled (any case)

      vendor_manager_name,
      customer_name,

      vendor_manager_contact_number,
      vendor_manager_contact_email,
      customer_contact_number,
      customer_contact_email,

      already_paid_amount,

      payment_status,              // advance_paid|fully_paid|refunded (any case)
      payment_method,

      paymentDetails,              // { customerPayable, vendorReceivable }
      payment_method_details,      // array of method entries
      paymentBreakdowns,           // array of payment break points passed from checkout

      // For compatibility with some callers
      final_order_items,           // cart items array
      vendor_segments,             // multi-vendor segments
    } = body;

    // Required validations (minimal)
    const missing = [];
    if (!customer_id) missing.push("customer_id");
    if (!vendor_id) missing.push("vendor_id");
    if (!service_id) missing.push("service_id");
    if (!event_location) missing.push("event_location");
    if (!event_start) missing.push("event_start");
    if (typeof final_amount === "undefined" || final_amount === null) missing.push("final_amount");
    if (!customer_name) missing.push("customer_name");

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    // Normalize fields to match schema
    const locType = toUpperEnum(location_type);
    if (locType && !["INDOOR", "OUTDOOR"].includes(locType)) {
      return res.status(400).json({ message: "location_type must be INDOOR or OUTDOOR" });
    }

    const statusNorm = event_status ? event_status.toLowerCase() : undefined;
    if (statusNorm && !["booked", "upcoming", "ongoing", "completed", "cancelled"].includes(statusNorm)) {
      return res.status(400).json({ message: "event_status is invalid" });
    }

    const payStatusNorm = payment_status ? payment_status.toLowerCase() : undefined;
    if (payStatusNorm && !["advance_paid", "fully_paid", "refunded"].includes(payStatusNorm)) {
      return res.status(400).json({ message: "payment_status is invalid" });
    }

    const eventStartDate = toISODate(event_start);
    const eventEndDate = event_end ? toISODate(event_end) : null;
    if (!(eventStartDate instanceof Date) || isNaN(eventStartDate)) {
      return res.status(400).json({ message: "event_start must be a valid date" });
    }
    if (eventEndDate && !(eventEndDate instanceof Date) || (eventEndDate && eventEndDate < eventStartDate)) {
      console.log(`[BOOKING_DEBUG] Validation failed: eventEndDate(${eventEndDate}) < eventStartDate(${eventStartDate})`);
      return res.status(400).json({ message: "event_end must be after or equal to event_start" });
    }

    const finalAmountNum = asNumber(final_amount);
    const alreadyPaid = asNumber(already_paid_amount, 0);

    if (alreadyPaid > finalAmountNum) {
      return res.status(400).json({ message: "already_paid_amount cannot exceed final_amount" });
    }

    // Map paymentDetails to schema payment_details
    const payment_details = paymentDetails
      ? {
        customerPayable: {
          total: asNumber(paymentDetails?.customerPayable?.total, 0),
          baseAmount: asNumber(paymentDetails?.customerPayable?.baseAmount, 0),
          convenienceFee: asNumber(paymentDetails?.customerPayable?.convenienceFee, 0),
          taxOnConvenience: asNumber(paymentDetails?.customerPayable?.taxOnConvenience, 0),
          convenienceFeeBefore: asNumber(paymentDetails?.customerPayable?.convenienceFeeBefore, 0),
          taxOnConvenienceBefore: asNumber(paymentDetails?.customerPayable?.taxOnConvenienceBefore, 0),
          couponCode: paymentDetails?.customerPayable?.couponCode ?? null,
          discountAmount: asNumber(paymentDetails?.customerPayable?.discountAmount, 0),
        },
        vendorReceivable: {
          total: asNumber(paymentDetails?.vendorReceivable?.total, 0),
          baseAmount: asNumber(paymentDetails?.vendorReceivable?.baseAmount, 0),
          commission: asNumber(paymentDetails?.vendorReceivable?.commission, 0),
          taxOnCommission: asNumber(paymentDetails?.vendorReceivable?.taxOnCommission, 0),
        },
      }
      : undefined;

    // Normalize payment_method_details array
    const normalizedMethodDetails = Array.isArray(payment_method_details)
      ? payment_method_details.map((m) => ({
        channel: m?.channel,
        cf_payment_id: m?.cf_payment_id,
        payment_amount: asNumber(m?.payment_amount),
        payment_completion_time: m?.payment_completion_time ? new Date(m.payment_completion_time) : undefined,
        payment_status: m?.payment_status,
        payment_message: m?.payment_message,
        payment_group: m?.payment_group,
        method_details: m?.method_details || {},
      }))
      : undefined;

    // Normalize cart items
    const items = Array.isArray(final_order_items)
      ? final_order_items.map((it) => ({
        entity: it?.entity,
        name_of_service: it?.name_of_service,
        service_asset: Array.isArray(it?.service_asset) ? it.service_asset : [],
        quantity: asNumber(it?.quantity, 1),
        description: it?.description,
        price: asNumber(it?.price, 0),
        tax_rate: asNumber(it?.tax_rate, 0),
        tax_type: it?.tax_type,
        tax_amount: asNumber(it?.tax_amount, 0),
        total_amount: asNumber(it?.total_amount, 0),
      }))
      : [];

    // Build document payload
    const doc = {
      // event_id: let schema default create if not provided or generate on update path
      customer_id,
      vendor_id,
      service_id,
      quotation_id,
      order_id,
      em_id,
      event_type,
      location_type: locType || "INDOOR",
      event_location,
      event_start: eventStartDate,
      event_end: eventEndDate || undefined,
      final_guest_count: asNumber(final_guest_count),
      specific_terms: nonEmptyArray(specific_terms),
      final_amount: finalAmountNum,
      event_status: statusNorm || "booked",
      vendor_manager_name,
      customer_name,
      vendor_manager_contact_number,
      vendor_manager_contact_email,
      customer_contact_number,
      customer_contact_email,
      already_paid_amount: alreadyPaid,
      payment_status: payStatusNorm || "advance_paid",
      payment_method,
      payment_details,
      payment_breakdowns: paymentBreakdowns || [], // Save into Event
      payment_method_details: normalizedMethodDetails,
      final_order_items: items,
      vendor_segments: vendor_segments || [],
    };

    let saved;
    if (event_id) {
      // Update the pre-created EVTY document (from verifyCustomerPayment)
      saved = await Events.findOneAndUpdate(
        { event_id },
        { $set: doc },
        { new: true, upsert: false }
      );
      if (!saved) {
        // If not found, create a fresh with given event_id to preserve linkage
        saved = await Events.create({ event_id, ...doc });
      }
    } else {
      // Create new booking; event_id and event_number handled by schema
      saved = await Events.create(doc);
    }

    if (quotation_id) {
      await Quotations.findOneAndUpdate(
        { quotation_id },
        { $set: { quote_status: 'In_Booking' } }
      );
    }

    // Sync with Final Order (FinalOrder)
    if (em_id && service_id) {
      const orderUpdatePayload = {
        event_id: saved.event_id || saved._id, // Link Order to Event
        paymentDetails: {
          paymentStatus: payStatusNorm === "fully_paid" ? "Fully Paid" : "Partially Paid",
          customerPayable: {
            total: asNumber(paymentDetails?.customerPayable?.total, 0),
            baseAmount: asNumber(paymentDetails?.customerPayable?.baseAmount, 0),
            convenienceFee: asNumber(paymentDetails?.customerPayable?.convenienceFee, 0),
            taxOnConvenience: asNumber(paymentDetails?.customerPayable?.taxOnConvenience, 0),
          },
          vendorReceivable: {
            total: asNumber(paymentDetails?.vendorReceivable?.total, 0),
            baseAmount: asNumber(paymentDetails?.vendorReceivable?.baseAmount, 0),
            commission: asNumber(paymentDetails?.vendorReceivable?.commission, 0),
            taxOnCommission: asNumber(paymentDetails?.vendorReceivable?.taxOnCommission, 0),
          },
        },
      };

      await Order.findOneAndUpdate(
        { em_id, service_id, quotation_id },
        { $set: orderUpdatePayload }
      );

      // --- NEW: Record Transaction and Trigger Invoicing for FREE BOOKING ---
      if (payStatusNorm === "fully_paid" || (paymentDetails?.customerPayable?.total || 0) === 0) {
        try {
          const { Transaction } = await import("../models/transactions.js");
          const { sqs } = await import("../config/awsConfig.js");
          const { SendMessageCommand } = await import("@aws-sdk/client-sqs");

          const trnId = generateUniqueId("TRN_FREE");

          await Transaction.create({
            quotation_id: quotation_id || effectiveQuotationId,
            event_id: saved.event_id || saved._id,
            internalOrderId: event_id || (em_id && service_id && quotation_id ? `ODR_${quotation_id}` : null),
            vendor_id: vendor_id,
            customer_id: customer_id,
            service_id: service_id,
            pgOrderId: "free_booking",
            pgStatus: "PAID",
            transfer_id: trnId,
            status: "SUCCESS",
            transfer_amount: 0,
            transfer_mode: "FREE_BOOKING",
            payment_type: "Token",
            paymentDetails: orderUpdatePayload.paymentDetails
          });

          const vSegs = req.body.vendor_segments && req.body.vendor_segments.length > 0
            ? req.body.vendor_segments.map(s => ({
              vendor_id: s.vendor_id,
              service_id: s.service_id,
              vendor_name: s.vendor_name || "Vendor",
              paymentDetails: s.paymentDetails,
              paymentBreakdowns: s.paymentBreakdowns,
              serviceData: s.serviceData || {}
            }))
            : [];

          const sqsMessage = {
            type: "bookingPayment",
            customer: { id: customer_id, name: doc.customer_name, mobile: doc.customer_contact_number, email: doc.customer_contact_email },
            vendor: { id: vendor_id, name: doc.vendor_manager_name },
            vendor_segments: vSegs,
            paymentDetails: {
              event_id: saved.event_id || saved._id,
              amount: 0,
              paidAmount: 0,
              finalAmount: orderUpdatePayload.paymentDetails.customerPayable.total,
              paymentType: "Token",
              method: "Free Booking",
              items: doc.final_order_items,
              transaction_id: trnId,
              date: new Date().toLocaleDateString("en-GB")
            },
          };

          await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.INVOICE_QUEUE_URL || (process.env.IS_DEV === "true"
              ? "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-test-queue"
              : "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue"),
            MessageBody: JSON.stringify(sqsMessage),
          }));
          console.log(`[BOOKING] Recorded FREE transaction and sent SQS for invoicing for Order: ${quotation_id}`);
        } catch (syncErr) {
          console.error("[BOOKING] Failed to sync free booking transaction/invoice:", syncErr.message);
        }
      }
    }

    // Resolve Quotation ID
    let effectiveQuotationId = quotation_id || body.quotationId;

    if (!effectiveQuotationId && event_id && event_id.startsWith("ODR")) {
      try {
        const sourceOrder = await Order.findOne({ order_id: event_id });
        if (sourceOrder && sourceOrder.quotation_id) {
          effectiveQuotationId = sourceOrder.quotation_id;
        }
      } catch (err) { }
    }

    // Process Payment Breakdowns Status Update
    try {
      if (normalizedMethodDetails && normalizedMethodDetails.length > 0) {
        // Last one pushed usually represents the new valid payment just made
        const recentPayment = normalizedMethodDetails[normalizedMethodDetails.length - 1];
        if (recentPayment && recentPayment.payment_status === "SUCCESS") {
          const breakdownNamePassed = recentPayment.payment_group;

          if (breakdownNamePassed) {
            console.log(`[BOOKING] Attempting to mark payment breakdown "${breakdownNamePassed}" as Paid for ${effectiveQuotationId}`);

            const updateQuery = breakdownNamePassed === "FULL"
              ? { $set: { "paymentBreakdowns.$[elem].status": "Paid", "paymentBreakdowns.$[elem].paid_at": new Date() } }
              : { $set: { "paymentBreakdowns.$[elem].status": "Paid", "paymentBreakdowns.$[elem].paid_at": new Date() } };

            const arrayFilters = breakdownNamePassed === "FULL"
              ? [{ "elem.status": { $ne: "Paid" } }]
              : [{ "elem.name": breakdownNamePassed }];

            const updateOptions = { arrayFilters, new: true };

            // Apply to Orders Model
            let orderRes = await Order.updateMany(
              { quotation_id: effectiveQuotationId },
              updateQuery,
              updateOptions
            );

            // Apply to AnonCustomerOrder Model
            let anonRes = await AnonCustomerOrder.updateMany(
              { anon_order_id: effectiveQuotationId },
              updateQuery,
              updateOptions
            );

            // Apply to Events Model
            const eventUpdateQuery = breakdownNamePassed === "FULL"
              ? { $set: { "payment_breakdowns.$[elem].status": "Paid", "payment_breakdowns.$[elem].paid_at": new Date() } }
              : { $set: { "payment_breakdowns.$[elem].status": "Paid", "payment_breakdowns.$[elem].paid_at": new Date() } };

            let eventRes = await Events.updateMany(
              { event_id: saved.event_id || saved._id },
              eventUpdateQuery,
              updateOptions
            );

            console.log(`[BOOKING] Mark Paid Result -> Orders: ${orderRes.modifiedCount}, Anon: ${anonRes.modifiedCount}, Events: ${eventRes.modifiedCount}`);
          }
        }
      }
    } catch (paymentBreakdownErr) {
      console.error("[BOOKING] Failed to map paymentBreakdowns paid status:", paymentBreakdownErr);
    }

    // Handle anonymous order conversion if applicable

    // Fallback: If quotation_id is missing, try to find it via Order if event_id is an Order ID (ODR...)
    if (!effectiveQuotationId && event_id && event_id.startsWith("ODR")) {
      console.log(`[BOOKING] quotation_id missing. Attempting lookup via Order ID: ${event_id}`);
      try {
        const sourceOrder = await Order.findOne({ order_id: event_id });
        if (sourceOrder && sourceOrder.quotation_id) {
          effectiveQuotationId = sourceOrder.quotation_id;
          console.log(`[BOOKING] Resolved quotation_id from Order: ${effectiveQuotationId}`);
        }
      } catch (err) {
        console.error("[BOOKING] Failed to lookup Order:", err);
      }
    }

    console.log(`[BOOKING] Checking for anonymous order conversion. Effective Quotation ID: '${effectiveQuotationId}'`);

    if (effectiveQuotationId && effectiveQuotationId.startsWith("ANON_ODR_")) {
      console.log(`[BOOKING] Match found for ANON_ODR_. Converting...`);

      const anonOrder = await AnonCustomerOrder.findOneAndUpdate(
        { anon_order_id: effectiveQuotationId },
        {
          $set: {
            order_status: "converted",
            converted_to_order_id: saved.event_id || saved._id,
            converted_at: new Date(),
          },
        },
        { new: true }
      );

      if (!anonOrder) {
        console.error(`[BOOKING] ❌ FATAL: AnonCustomerOrder NOT FOUND for ID: ${quotation_id}`);
      } else {
        console.log(`[BOOKING] ✅ AnonCustomerOrder marked as converted.`);
      }

      if (anonOrder) {
        // Update the chat message card_data to reflect "converted" status
        // Update both order_summary and approval_request types
        // Broaden query to match anon_order_id OR quotation_id in card_data
        const updateResult = await Message.updateMany(
          {
            $or: [
              { "card_data.anon_order_id": effectiveQuotationId },
              { "card_data.quotation_id": effectiveQuotationId }
            ],
            message_type: { $in: ["order_summary", "approval_request"] },
          },
          { $set: { "card_data.order_status": "converted" } }
        );

        console.log(`[BOOKING] Updated ${updateResult.modifiedCount} chat messages to converted status for ${effectiveQuotationId}`);

        // Emit socket event for real-time update
        if (req.io && anonOrder.chat_id) {
          const chat = await Chat.findOne({ chat_id: anonOrder.chat_id });
          const chatType = chat ? chat.chat_type : "anon_customer-admin";

          const rooms = [
            `${anonOrder.chat_id}-${chatType}`,
            `${anonOrder.chat_id}-anon_customer-admin`,
            `${anonOrder.chat_id}-customer-admin`
          ];
          const uniqueRooms = [...new Set(rooms)];

          uniqueRooms.forEach(roomId => {
            req.io.to(roomId).emit("order_status_updated", {
              anon_order_id: effectiveQuotationId,
              new_status: "converted",
              event_id: saved.event_id || saved._id
            });
          });
          console.log(`[BOOKING] Emitted order_status_updated for ${effectiveQuotationId} to rooms: ${uniqueRooms.join(', ')}`);
        }
      } else {
        console.warn(`[BOOKING] AnonCustomerOrder not found for conversion: ${effectiveQuotationId}`);
      }
    }

    if (process.env.IS_DEV !== 'true') {
      sendSlackBookingMessage({
        bookingid: saved.event_id || saved._id,
        customer: saved.customer_name,
        vendorId: saved.vendor_id,
        serviceName: saved.service_id,
        guest: saved.final_guest_count || 0,
        startDate: new Date(saved.event_start).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
    }

    return res.status(201).json({
      message: "Event created successfully",
      event: saved,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({
      message: "An error occurred while creating the event",
      error: error.message,
    });
  }
};


export const getBooking = async (req, res) => {
  try {
    const { service_id, vendor_id } = req.query;

    if (!service_id) {
      return res.status(400).json({ message: "Please provide service ID" });
    }
    if (!vendor_id) {
      return res.status(400).json({ message: "Please provide vendor ID" });
    }

    const booking = await Events.find({ vendor_id, service_id });

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchBooking = async (req, res) => {
  try {
    const { service_id } = req.query;

    if (!service_id) {
      return res.status(400).json({ message: "Please provide service ID" });
    }

    const booking = await Events.find({ service_id });

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  const { event_id } = req.params; // Retrieve the booking ID from the URL parameters
  const updateData = req.body; // Expecting the updated data from the request body

  try {
    const updatedBooking = await Events.findOneAndUpdate(
      { event_id: event_id }, // filter object
      updateData,
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  const { event_id } = req.params; // Retrieve event_id from URL parameters

  try {
    const deletedBooking = await Events.findOneAndDelete({ event_id });

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Events.find();
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving bookings", error: error.message });
  }
};

export const addOfflineEvent = async (req, res) => {
  //type -> service_type
  try {
    const { event_start, event_end, type, event_description, event_highlight, event_name, quotation_id } = req.body;
    const { service_id } = req.query;

    if (!service_id || !event_start || !event_end || !type || !event_highlight || !event_description) {
      return res.status(400).json({
        message: "Missing required fields: serId, title, start, end, type, color",
      });
    }

    // Expect start/end to be ISO UTC strings (from frontend fix). Coerce and validate.
    const startDate = new Date(event_start);   // e.g., 2025-10-15T04:30:00.000Z
    const endDate = new Date(event_end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid start or end datetime" });
    }
    if (endDate < startDate) {
      return res.status(400).json({ message: "end must be after or equal to start" });
    }

    const colorOptions = {
      "#94CCC1": "teal",
      "#D59D53": "orange",
      "#6D65C3": "indigo",
      "#509BF0": "blue",
      "#F050E3": "purple",
    };

    const calendar = new Calendar({
      service_id: service_id,
      event_start: startDate,
      event_end: endDate,
      event_name: event_name,
      event_description: event_description,
      event_highlight: event_highlight,
      event_source: 'EXTERNAL',
      event_type: 'booked'
    });

    await calendar.save();

    return res.status(200).json({ message: "Event added successfully", calendar });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editOfflineEvent = async (req, res) => {
  try {
    const { event_id, updatedEventData } = req.body;


    // Validation
    if (!event_id || !updatedEventData) {
      return res.status(400).json({
        message: "Missing required fields: service_id, event_id, or updatedEventData",
      });
    }

    // Find the calendar entry by event_id
    const calendar = await Calendar.findOne({ event_id });
    if (!calendar) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Update allowed fields
    Object.assign(calendar, updatedEventData);

    // Save the updated calendar
    await calendar.save();

    return res.status(200).json({
      message: "Event updated successfully",
      updatedCalendar: calendar,
    });
  } catch (error) {
    console.error("Error updating offline event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteOfflineEvent = async (req, res) => {
  try {
    const { event_id } = req.body; // Extract parameters

    if (!event_id) {
      return res
        .status(400)
        .json({ message: "Missing event_id" });
    }

    //delete the calendar by event_id
    await Calendar.deleteOne({ event_id });

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVendorBookings = async (req, res) => {
  try {
    const { service_id } = req.query;

    if (!service_id) {
      return res.status(400).json({ message: "service_id is required" });
    }

    // Fetch offline bookings from Calendar collection
    const offlineBookings = await Calendar.find({
      service_id,
      event_source: "EXTERNAL"
    });

    // Fetch online bookings from Events collection
    const onlineBookings = await Events.find({ service_id });

    const totalBookings = offlineBookings.length + onlineBookings.length;

    // Respond
    return res.status(200).json({
      success: true,
      totalBookings: totalBookings,
      offlineCount: offlineBookings.length,
      onlineCount: onlineBookings.length,
      offlineBookings,
      onlineBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/bookings/get-by-id/:event_id
export const getBookingById = async (req, res) => {
  try {
    const { event_id } = req.params;
    if (!event_id) return res.status(400).json({ message: "Event ID is required" });

    // 1) Load event
    const booking = await Events.findOne({ event_id });
    if (!booking) return res.status(404).json({ message: "Event not found" });

    // 2) Resolve service model by service_id prefix
    const sid = booking.service_id || "";
    let serviceModel = null;
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
    } else if (sid.startsWith("PRO")) {
      serviceModel = null; // Prop rental not implemented
    } else {
      serviceModel = null; // Unknown type; continue without service
    }

    // 3) Load service document if model found
    let service = null;
    if (serviceModel) {
      service = await serviceModel.findOne({ service_id: sid });
    }

    // 4) Respond with unified payload
    return res.status(200).json({ booking, service });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getBookingsByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const bookings = await Events.find({ customer_id });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this customer" });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings by customerId:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// rm admin api for getting services of a vendor
// NOT UPDATED YET 
export const getAllVendorServiceSchedules = async (req, res) => {
  const { vendorId, services } = req.body;

  if (!vendorId || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ message: "vendorId and services array are required" });
  }

  try {
    const groupedByType = {};

    for (const service of services) {
      const { type, id: serviceId } = service;
      const serviceType = type.toLowerCase();

      let vendorModel;

      switch (serviceType) {
        case "venue-provider":
          vendorModel = Venue;
          break;
        case "caterer":
          vendorModel = Caterer;
          break;
        case "decorator":
          vendorModel = Decorator;
          break;
        case "photographer":
        case "pav":
          vendorModel = Photographer;
          break;
        case "makeup-artist":
        case "makeupartist":
          vendorModel = MakeupArtist;
          break;
        default:
          continue;
      }

      const vendorDoc = await vendorModel.findOne({ id: serviceId }, "schedule");
      const onlineBookings = await Booking.find({ venId: vendorId, serviceId });

      if (!groupedByType[serviceType]) {
        groupedByType[serviceType] = {
          type: serviceType,
          offlineBookings: [],
          onlineBookings: [],
        };
      }

      // Append offline & online bookings for this type
      groupedByType[serviceType].offlineBookings.push(...(vendorDoc?.schedule || []));
      groupedByType[serviceType].onlineBookings.push(...onlineBookings);
    }

    return res.status(200).json({ services: Object.values(groupedByType) });
  } catch (error) {
    console.error("Error fetching all schedules:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
//to be done
export const addBookingInvoice = async (req, res) => {
  try {
    const { bookingId, customerInvoiceUrl, vendorInvoiceUrl } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    if (!customerInvoiceUrl && !vendorInvoiceUrl) {
      return res.status(400).json({ error: 'At least one invoice URL is required' });
    }

    const update = {};
    if (customerInvoiceUrl) update['$push'] = { 'invoices.customerInvoices': customerInvoiceUrl };
    if (vendorInvoiceUrl) {
      if (!update['$push']) update['$push'] = {};
      update['$push']['invoices.vendorInvoices'] = vendorInvoiceUrl;
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingid: bookingId },
      update,
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: `Booking with id ${bookingId} not found` });
    }

    res.status(200).json({
      message: 'Invoice URLs added successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error adding invoice URLs to booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ---------------------- UPDATE EVENT PAYMENT DETAILS ----------------------
export const updateEventPaymentDetails = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { paymentDetails, payment_method_details } = req.body;

    // Validate required payment details fields
    if (!paymentDetails && !payment_method_details) {
      return res.status(400).json({
        message: "Either paymentDetails or payment_method_details is required"
      });
    }

    const updateFields = {};
    if (paymentDetails) {
      updateFields.paymentDetails = paymentDetails;
    }
    if (payment_method_details) {
      updateFields.payment_method_details = payment_method_details;
    }

    const updatedEvent = await Events.findOneAndUpdate(
      { event_id },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      message: "Event payment details updated successfully",
      data: updatedEvent
    });
  } catch (error) {
    console.error("Failed to update event payment details:", error);
    res.status(500).json({
      message: "Failed to update event payment details",
      error: error.message
    });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { event_id } = req.params;

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Try to find in Events collection (new model)
    let event = await Events.findOne({ event_id });

    // If not found, try old Booking model
    if (!event) {
      const { Booking } = await import("../models/booking.js");
      const oldBooking = await Booking.findOne({ bookingid: event_id });
      if (oldBooking) {
        // Update old booking model
        oldBooking.status = "Cancelled";
        await oldBooking.save();
        return res.status(200).json({
          message: "Booking cancelled successfully",
          booking: oldBooking
        });
      }
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if already cancelled
    if (event.event_status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Update event status to cancelled
    const updatedEvent = await Events.findOneAndUpdate(
      { event_id },
      {
        $set: {
          event_status: "cancelled",
          event_updated_at: new Date()
        }
      },
      { new: true }
    );

    // Also update order status if order exists
    if (event.quotation_id) {
      const Orders = (await import("../models/orders.js")).default;
      await Orders.findOneAndUpdate(
        { quotation_id: event.quotation_id },
        {
          $set: {
            order_status: "cancelled",
            order_updated_at: new Date()
          }
        }
      );
    }

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking: updatedEvent
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      message: "Failed to cancel booking",
      error: error.message
    });
  }
};

// GET /api/bookings/transactions/:event_id
export const getTransactionsByEventId = async (req, res) => {
  try {
    const { event_id } = req.params;
    if (!event_id) return res.status(400).json({ message: "event_id is required" });

    const event = await Events.findOne({ event_id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { Transaction } = await import("../models/transactions.js");

    // Fetch the order to get the correct internal order id
    const order = await Order.findOne({ quotation_id: event.quotation_id }).lean();
    const internalOrderId = order ? order.order_id : null;

    // Broaden search to catch transactions linked by quotation_id, event_id, or the order's internal ID
    const queryOr = [
      { quotation_id: event.quotation_id },
      { event_id: event.event_id },
      { quotation_id: event.event_id }
    ];

    if (internalOrderId) {
      queryOr.push({ internalOrderId: internalOrderId });
    }

    const transactions = await Transaction.find({ $or: queryOr })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ transactions, event_id, quotation_id: event.quotation_id });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
