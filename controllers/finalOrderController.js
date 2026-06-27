import Order from "../models/orders.js";
import { Events } from "../models/events.js";
import customerNotification from "../models/customerNotifications.js";
import vendorNotification from "../models/vendorNotifications.js";
import adminNotification from "../models/emNotifications.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import {
  sendFCMNotificationToVendor,
  sendFCMNotificationToEm,
} from "../utils/firebaseNotificationUtils.js";
import { Customer } from "../models/customer.js";

export const createOrUpdateFinalOrder = async (req, res) => {
  console.log("\n📩 FINAL ORDER API HIT");

  try {
    const skipClean = req.query.skipClean === "true";
    console.log("🔍 skipClean:", skipClean);

    const {
      order_id,
      quotation_id,
      em_id,
      paymentDetails,
      customer_contact_number,
      customer_name,
      specificTerms,
      paymentBreakdowns,
      ...incomingData
    } = req.body;

    let finalCustomerId = incomingData.customer_id;

    // 🆕 HANDLE NEW CUSTOMER CREATION IF NO CUSTOMER ID
    // 🆕 HANDLE CUSTOMER LOOKUP
    // Only look up if customer_id is explicitly missing/null OR it looks like a temporary ID
    const isTempId =
      finalCustomerId &&
      (finalCustomerId.startsWith("NEW_") || finalCustomerId === "gen_user_id");

    if ((!finalCustomerId || isTempId) && customer_contact_number) {
      console.log(
        "🆕 Checking for existing customer by number:",
        customer_contact_number,
      );

      // Normalize number if needed (basic strip for now, assuming standard format)
      // const normalizedNumber = normalizePhoneNumber(customer_contact_number);

      let existingCustomer = await Customer.findOne({
        contact_number: customer_contact_number,
      });

      if (existingCustomer) {
        console.log(
          "✅ Found existing customer:",
          existingCustomer.customer_id,
        );
        finalCustomerId = existingCustomer.customer_id;
      } else {
        console.log("✨ Creating NEW customer for order");
        const newCustomer = await Customer.create({
          customer_name: customer_name || "Guest User",
          contact_number: customer_contact_number,
          customer_contact_email: incomingData.customer_contact_email,
          // Add any other required defaults
        });
        finalCustomerId = newCustomer.customer_id;
        console.log("✅ Created new customer:", finalCustomerId);
      }
    }

    if (!finalCustomerId) {
      console.warn(
        "⚠️ Proceeding without customer_id (migrated legacy behavior or error)",
      );
    }

    // if (!quotation_id) {
    //   console.log("❌ quotation_id missing");
    //   return res.status(400).json({ message: "quotation_id is required" });
    // }

    // Initialize update fields
    const updateFields = {
      customer_id: finalCustomerId,
      customer_name: customer_name,
      customer_contact_number: customer_contact_number,
    };

    // DELETE OLD APPROVAL MESSAGES FOR NEW NEGOTIATION
    if (!skipClean) {
      const deletedMessages = await Message.deleteMany({
        chat_id: quotation_id,
        message_type: "approval_request",
      });

      console.log(
        "🗑️ Deleted approval_request messages:",
        deletedMessages.deletedCount,
      );

      // Reset approvals
      updateFields.customer_approval = null;
      updateFields.vendor_approval = null;
      console.log("🔄 Approvals reset to null for new final order");
    } else {
      console.log("⚠️ Skipped deletion / approval reset");
    }

    // BUILD updateFields
    for (const key of Object.keys(incomingData)) {
      const val = incomingData[key];
      if (typeof val !== "object" || Array.isArray(val)) {
        updateFields[key] = val;
      }
    }

    updateFields.quotation_id = quotation_id;
    if (paymentDetails) updateFields.paymentDetails = paymentDetails;
    if (paymentBreakdowns) updateFields.paymentBreakdowns = paymentBreakdowns;
    if (specificTerms) updateFields.specificTerms = specificTerms;
    if (em_id) updateFields.em_id = em_id;

    // ── MULTI-VENDOR SEGMENT PROCESSING ──
    const vendor_segments = incomingData.vendor_segments;
    if (Array.isArray(vendor_segments) && vendor_segments.length > 0) {
      console.log(`📦 Processing ${vendor_segments.length} vendor segment(s)`);

      // 1. Persist segments on the order
      updateFields.vendor_segments = vendor_segments;

      // 2. Derive compat mirrors from segment[0]
      const s0 = vendor_segments[0];
      if (!updateFields.vendor_id) updateFields.vendor_id = s0.vendor_id;
      if (!updateFields.service_id) updateFields.service_id = s0.service_id;
      if (!updateFields.vendor_name) updateFields.vendor_name = s0.vendor_name;
      if (!updateFields.vendor_manager_name)
        updateFields.vendor_manager_name = s0.vendor_manager_name;
      if (!updateFields.vendor_manager_contact_number)
        updateFields.vendor_manager_contact_number =
          s0.vendor_manager_contact_number;
      if (!updateFields.vendor_manager_contact_email)
        updateFields.vendor_manager_contact_email =
          s0.vendor_manager_contact_email;
      if (!updateFields.event_type) updateFields.event_type = s0.event_type;
      if (!updateFields.event_start) updateFields.event_start = s0.event_start;
      if (!updateFields.event_end) updateFields.event_end = s0.event_end;
      if (!updateFields.event_location)
        updateFields.event_location = s0.event_location;
      if (!updateFields.vendor_location)
        updateFields.vendor_location = s0.vendor_location;
      if (!updateFields.location_type)
        updateFields.location_type = s0.location_type;
      if (!updateFields.final_guest_count)
        updateFields.final_guest_count = s0.final_guest_count;

      // 3. Build flat final_order_items (tagged per vendor)
      const flatItems = [];
      for (const seg of vendor_segments) {
        for (const item of seg.segment_final_order_items || []) {
          flatItems.push({
            ...item,
            vendor_id: seg.vendor_id,
            service_id: seg.service_id,
            vendor_name: seg.vendor_name,
          });
        }
      }
      updateFields.final_order_items = flatItems;

      // 4. Merge per-segment terms (deduplicated union)
      const allTerms = new Set();
      for (const seg of vendor_segments) {
        for (const t of seg.specificTerms || []) allTerms.add(t);
      }
      updateFields.specificTerms = [...allTerms];

      // 4.5 Assign vendor commission ONLY to the final breakdown (Final Pay / last milestone)
      // Commission must not be deducted from Token or Advance payouts
      for (const seg of vendor_segments) {
        const segBreakdowns = seg.paymentBreakdowns || [];
        const validBreakdowns = segBreakdowns.filter(
          (b) => b.name !== "Discount",
        );

        const overallCommission =
          Number(seg.paymentDetails?.vendorReceivable?.commission) || 0;
        const overallTaxOnCommission =
          Number(seg.paymentDetails?.vendorReceivable?.taxOnCommission) || 0;
        const totalCommission = overallCommission + overallTaxOnCommission;

        // Find the last milestone (Final Pay preferred, otherwise the actual last one)
        const finalIdx = validBreakdowns.findIndex(
          (b) => b.name === "Final Pay",
        );
        const lastIdx = finalIdx !== -1 ? finalIdx : validBreakdowns.length - 1;

        for (let i = 0; i < validBreakdowns.length; i++) {
          const b = validBreakdowns[i];
          const amt = Number(b.amount) || 0;
          b.vendor_base_amount = amt;
          if (i === lastIdx) {
            b.vendor_commission = Number(totalCommission.toFixed(2));
          } else {
            b.vendor_commission = 0;
          }
        }
      }

      // 5. Build COMBINED customer payment schedule
      //    Sum amounts for same-name milestones across all segments
      const milestoneOrder = [
        "Token",
        "Advance 1",
        "Advance 2",
        "Advance 3",
        "Advance 4",
        "Final Pay",
        "Last Pay",
        "Discount",
      ];
      const milestoneMap = new Map();
      for (const seg of vendor_segments) {
        for (const b of seg.paymentBreakdowns || []) {
          if (milestoneMap.has(b.name)) {
            const existing = milestoneMap.get(b.name);
            existing.amount += Number(b.amount) || 0;
            // Keep earliest date
            if (
              b.date &&
              (!existing.date || new Date(b.date) < new Date(existing.date))
            ) {
              existing.date = b.date;
            }
          } else {
            milestoneMap.set(b.name, { ...b, amount: Number(b.amount) || 0 });
          }
        }
      }
      const mergedBreakdowns = [...milestoneMap.values()].sort(
        (a, b) =>
          milestoneOrder.indexOf(a.name) - milestoneOrder.indexOf(b.name),
      );

      // 5.5 Inject platform margin (Convenience Fee + Taxes) into the Final Pay checkout milestone
      if (
        updateFields.paymentDetails &&
        updateFields.paymentDetails.customerPayable
      ) {
        const cp = updateFields.paymentDetails.customerPayable;
        const platformCcfShare =
          (Number(cp.convenienceFee) || 0) + (Number(cp.taxOnConvenience) || 0);
        if (platformCcfShare > 0 && mergedBreakdowns.length > 0) {
          let targetIdx = mergedBreakdowns.findIndex(
            (b) => b.name === "Final Pay",
          );
          if (targetIdx === -1) targetIdx = mergedBreakdowns.length - 1;
          mergedBreakdowns[targetIdx].amount += platformCcfShare;
        }
      }

      updateFields.paymentBreakdowns = mergedBreakdowns;

      // 6. Aggregate vendor receivable total across segments
      if (updateFields.paymentDetails) {
        const totalReceivable = vendor_segments.reduce(
          (sum, seg) =>
            sum + (Number(seg.paymentDetails?.vendorReceivable?.total) || 0),
          0,
        );
        const totalBaseAmount = vendor_segments.reduce(
          (sum, seg) =>
            sum +
            (Number(seg.paymentDetails?.vendorReceivable?.baseAmount) || 0),
          0,
        );
        const totalCommission = vendor_segments.reduce(
          (sum, seg) =>
            sum +
            (Number(seg.paymentDetails?.vendorReceivable?.commission) || 0),
          0,
        );
        const totalTaxOnCommission = vendor_segments.reduce(
          (sum, seg) =>
            sum +
            (Number(seg.paymentDetails?.vendorReceivable?.taxOnCommission) ||
              0),
          0,
        );
        updateFields.paymentDetails = {
          ...updateFields.paymentDetails,
          vendorReceivable: {
            ...updateFields.paymentDetails.vendorReceivable,
            total: totalReceivable,
            baseAmount: totalBaseAmount,
            commission: totalCommission,
            taxOnCommission: totalTaxOnCommission,
          },
        };
      }

      console.log(
        `✅ Segments processed: ${flatItems.length} items, ${mergedBreakdowns.length} milestones, ${allTerms.size} terms`,
      );
    }

    // UPSERT THE ORDER
    // UPSERT OR CREATE ORDER
    let updatedOrder;
    if (order_id) {
      console.log("🔄 Updating existing order:", order_id);
      updatedOrder = await Order.findOneAndUpdate(
        { order_id },
        { $set: updateFields },
        { new: true, upsert: true }, // Upsert is fine if order_id is valid but not found (rare)
      );
    } else {
      console.log("✨ Creating FRESH order (no order_id provided)");
      // Create new order instance to trigger default order_id generation
      updatedOrder = await Order.create(updateFields);
    }

    console.log("✅ Final order saved:", updatedOrder.order_id);

    // ── SYNC ORDER EDITS TO LINKED EVENT ──
    if (order_id && updatedOrder.event_id) {
      try {
        const eventSyncFields = {};
        if (updateFields.final_order_items)
          eventSyncFields.final_order_items = updateFields.final_order_items;
        if (updateFields.final_amount != null)
          eventSyncFields.final_amount = updateFields.final_amount;
        if (updateFields.paymentDetails)
          eventSyncFields.payment_details = updateFields.paymentDetails;
        if (updateFields.specificTerms)
          eventSyncFields.specific_terms = updateFields.specificTerms;
        if (updateFields.event_type)
          eventSyncFields.event_type = updateFields.event_type;
        if (updateFields.event_start)
          eventSyncFields.event_start = updateFields.event_start;
        if (updateFields.event_end)
          eventSyncFields.event_end = updateFields.event_end;
        if (updateFields.event_location)
          eventSyncFields.event_location = updateFields.event_location;
        if (updateFields.vendor_location)
          eventSyncFields.vendor_location = updateFields.vendor_location;
        if (updateFields.location_type)
          eventSyncFields.location_type = updateFields.location_type;
        if (updateFields.final_guest_count != null)
          eventSyncFields.final_guest_count = updateFields.final_guest_count;
        if (updateFields.customer_name)
          eventSyncFields.customer_name = updateFields.customer_name;
        if (updateFields.customer_contact_number)
          eventSyncFields.customer_contact_number =
            updateFields.customer_contact_number;
        if (updateFields.customer_contact_email)
          eventSyncFields.customer_contact_email =
            updateFields.customer_contact_email;
        if (updateFields.vendor_segments)
          eventSyncFields.vendor_segments = updateFields.vendor_segments;

        // ── MERGE payment_breakdowns: preserve "Paid" statuses from event ──
        if (updateFields.paymentBreakdowns) {
          const existingEvent = await Events.findOne({
            event_id: updatedOrder.event_id,
          }).lean();
          const existingBreakdowns = existingEvent?.payment_breakdowns || [];

          // Build a map of existing paid statuses by breakdown name
          const paidStatusMap = {};
          for (const eb of existingBreakdowns) {
            if (eb.status === "Paid") {
              paidStatusMap[eb.name] = true;
            }
          }

          // Merge: keep paid status for existing breakdowns, new ones stay as-is
          const mergedBreakdowns = updateFields.paymentBreakdowns.map((b) => ({
            ...b,
            status: paidStatusMap[b.name] ? "Paid" : b.status || "Unpaid",
          }));

          eventSyncFields.payment_breakdowns = mergedBreakdowns;
        }

        if (Object.keys(eventSyncFields).length > 0) {
          const syncResult = await Events.findOneAndUpdate(
            { event_id: updatedOrder.event_id },
            { $set: eventSyncFields },
            { new: true },
          );
          if (syncResult) {
            console.log(
              `[OrderSync] Event ${updatedOrder.event_id} synced with order changes.`,
            );
          } else {
            console.warn(
              `[OrderSync] Event ${updatedOrder.event_id} not found, skipping sync.`,
            );
          }
        }
      } catch (syncErr) {
        console.error(
          "[OrderSync] Failed to sync order to event:",
          syncErr.message,
        );
      }
    }

    // ------------------- SEND REAL-TIME NOTIFICATION -------------------
    try {
      const messageContent = `Final Order Generated: ${updatedOrder.order_id}. Please review and approve.`;

      // Use quotation_id from the updated order (guaranteed to exist)
      const targetChatId = updatedOrder.quotation_id;
      const targetEmId = updatedOrder.em_id || em_id || "system"; // Fallback to body or system

      console.log(`📡 Preparing to send chat message to ${targetChatId}`);

      if (!targetChatId) {
        console.warn("⚠️ No quotation_id, skipping chat/socket notifications");
      } else {
        const savedMessage = await Message.create({
          chat_id: targetChatId,
          chat_type: "customer-admin", // Defaulting to customer-admin for now, logic below handles both
          sender: "em",
          sender_id: targetEmId,
          message_content: messageContent,
          message_type: "approval_request",
          card_data: updatedOrder, // Pass order data so frontend can render the card
        });

        // Emit to Customer
        if (req.io) {
          // Customer Room
          const customerRoomId = `${targetChatId}-customer-admin`;
          req.io.to(customerRoomId).emit("new_message", {
            ...savedMessage.toObject(),
            chat_type: "customer-admin",
          });

          // Vendor Room (if different chat_type needed, create another message or just emit)
          // Usually approval request goes to both
          const vendorRoomId = `${targetChatId}-vendor-admin`;
          req.io.to(vendorRoomId).emit("new_message", {
            ...savedMessage.toObject(),
            chat_type: "vendor-admin",
          });

          console.log(
            `📤 Emitted approval_request to ${customerRoomId} and ${vendorRoomId}`,
          );
        }
      }
    } catch (msgErr) {
      console.error("Failed to send real-time order approval message:", msgErr);
    }

    return res.status(200).json({
      message: skipClean
        ? "Order updated without deleting old approval messages"
        : "Order processed & approval messages refreshed",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Final order error:", error.message);
    return res.status(400).json({
      message: "Failed to process booking",
      error: error.message,
    });
  }
};

// ---------------------- GET ALL FINAL ORDERS ----------------------
export const getAllFinalOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res
      .status(200)
      .json({ message: "All orders retrieved successfully", data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
};

// ---------------------- GET ORDER BY QUOTATION ID ----------------------
export const getOrderByQuotationId = async (req, res) => {
  const { quotation_id } = req.params;
  console.log("Fetching order for quotation_id:", quotation_id);
  try {
    const order = await Order.findOne({ quotation_id: quotation_id });
    console.log("Fetched order:", order);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- APPROVE / REJECT FINAL ORDER ----------------------
export const approveFinalOrder = async (req, res) => {
  try {
    const { order_id, userType, value } = req.body;

    if (!order_id || !userType || typeof value !== "boolean") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let fieldToUpdate;
    if (userType === "Vendor") {
      fieldToUpdate = "vendor_approval";
    } else if (userType === "Customer") {
      fieldToUpdate = "customer_approval";
    } else {
      return res.status(400).json({ message: "Invalid userType" });
    }

    const updateFields = {
      [fieldToUpdate]: value,
      last_approval: { approval_by: userType, value },
    };

    const order = await Order.findOneAndUpdate(
      { order_id },
      { $set: updateFields },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ CASE 1: Both parties approved
    if (order.customer_approval === true && order.vendor_approval === true) {
      console.log("CASE 1 triggered for order:", order.order_id);
      const parsedFinalPrice = Number(
        String(order.price || 0).replace(/,/g, ""),
      );
      const checkout_url =
        order.checkout_url ||
        `/checkout?amount=${parsedFinalPrice}&vendor_id=${order.vendor_id}&user_id=${order.customer_id}&orderId=${order.order_id}`;

      const message = `✅ Final Order Approved by both Vendor and Customer. (Order ID: ${order.order_id})`;

      await customerNotification.findOneAndUpdate(
        {
          customer_id: order.customer_id,
          order_id: order.order_id,
          notification_type: "checkout_message",
        },
        {
          $set: {
            final_amount: parsedFinalPrice,
            checkout_url,
            message,
            chat_id: order.quotation_id,
            quotation_id: order.quotation_id,
          },
        },
        { new: true, upsert: true },
      );

      await vendorNotification.create({
        vendor_id: order.vendor_id,
        service_id: order.service_id,
        order_id: order.order_id,
        chat_id: order.quotation_id,
        notification_type: "checkout_message",
        message,
      });

      await adminNotification.create({
        order_id: order.order_id,
        chat_id: order.quotation_id,
        em_id: order.em_id,
        notification_type: "checkout_message",
        message,
      });

      //Trigger for fcm for em for final order
      sendFCMNotificationToEm({
        emId: order.em_id,
        priority: "high",
        notification: {
          title: "Final Order Approved",
          body: message,
        },
        data: {
          type: "final_order_em",
          order_id: order.order_id,
          chat_id: order.quotation_id,
          quotation_id: order.quotation_id,
        },
      })
        .then((result) => {
          console.log(
            `FCM notifications sent to em ${order.em_id} for final order approval ${order.order_id}`,
            result,
          );
        })
        .catch((error) => {
          console.error(
            "Failed to send FCM notification for final order approval:",
            error,
          );
        });

      //Trigger for fcm for vendor app for final order
      sendFCMNotificationToVendor({
        vendorId: order.vendor_id,
        priority: "high",
        notification: {
          title: "Final Order Approved",
          body: `Final Order Approved by both Vendor and Customer. (Order ID: ${order.order_id})`,
        },
        data: {
          type: "final_order_approved",
          order_id: order.order_id,
          chat_id: order.quotation_id,
          quotation_id: order.quotation_id,
          customer_id: order.customer_id,
        },
      })
        .then((result) => {
          console.log(
            `FCM notifications sent to vendor ${order.vendor_id} for final order approval ${order.order_id}`,
            result,
          );
        })
        .catch((error) => {
          console.error(
            "Failed to send FCM notification for final order approval:",
            error,
          );
        });

      // Send message to customer chat only for payment/checkout
      try {
        const systemMessageContent = `✅ Final Order has been approved by both parties. Please proceed to payment.\n\nCheckout Link: ${checkout_url}`;

        // Send to customer-admin chat only
        const customerAdminChat = await Chat.findOne({
          chat_id: order.quotation_id,
          chat_type: "customer-admin",
        });

        if (customerAdminChat) {
          const savedMessage = await Message.create({
            chat_id: order.quotation_id,
            chat_type: "customer-admin",
            sender: "em",
            sender_id: order.em_id || "system",
            message_type: "system",
            message_content: systemMessageContent,
          });

          // Update chat timestamp so message appears
          if (typeof customerAdminChat.updateLastMessage === "function") {
            await customerAdminChat.updateLastMessage();
          } else {
            await Chat.updateOne(
              { chat_id: order.quotation_id, chat_type: "customer-admin" },
              {
                $set: {
                  last_message_updated_at: new Date(),
                  chat_updated_at: new Date(),
                },
              },
            );
          }

          // Emit message via Socket.IO
          if (req.io) {
            const roomId = `${order.quotation_id}-customer-admin`;
            req.io.to(roomId).emit("new_message", {
              _id: savedMessage._id,
              chat_id: savedMessage.chat_id,
              chat_type: savedMessage.chat_type,
              sender: savedMessage.sender,
              sender_id: savedMessage.sender_id,
              message_content: savedMessage.message_content,
              message_type: savedMessage.message_type,
              message_sent_at: savedMessage.message_sent_at,
            });
            console.log(`📤 Emitted payment message to room: ${roomId}`);
          }

          console.log(
            "✅ Chat message sent to customer-admin chat for payment",
          );
        }
      } catch (messageError) {
        console.error("❌ Failed to send chat message:", messageError);
      }

      try {
        const vendorAdminChat = await Chat.findOne({
          chat_id: order.quotation_id,
          chat_type: "vendor-admin",
        });

        if (vendorAdminChat && vendorAdminChat.chat_status !== "BLOCKED") {
          vendorAdminChat.chat_status = "BLOCKED";
          await vendorAdminChat.save();
        }

        const customerAdminChat = await Chat.findOne({
          chat_id: order.quotation_id,
          chat_type: "customer-admin",
        });

        if (customerAdminChat && customerAdminChat.chat_status !== "BLOCKED") {
          customerAdminChat.chat_status = "BLOCKED";
          await customerAdminChat.save();
        }
      } catch (chatError) {
        console.error("Error blocking chats:", chatError);
      }

      return res.status(200).json({
        message: `Both parties approved. Checkout link sent to customer.`,
        data: order,
        checkout_url,
      });
    }

    // ❌ Case: Rejected by any party
    if (order.customer_approval === false || order.vendor_approval === false) {
      console.log("CASE 2 triggered for order:", order.order_id);
      const message = `❌ Final Order marked for discussion by ${userType}. (Order ID: ${order.order_id})`;

      await vendorNotification.create({
        vendor_id: order.vendor_id,
        order_id: order.order_id,
        chat_id: order.quotation_id,
        service_id: order.service_id,
        notification_type: "chat_message",
        message,
      });

      await adminNotification.create({
        order_id: order.order_id,
        chat_id: order.quotation_id,
        em_id: order.em_id,
        notification_type: "chat_message",
        message,
      });

      await customerNotification.create({
        customer_id: order.customer_id,
        order_id: order.order_id,
        chat_id: order.quotation_id,
        quotation_id: order.quotation_id,
        notification_type: "chat_message",
        message,
      });

      //Trigger for fcm for em in app for final order
      sendFCMNotificationToEm({
        emId: order.em_id,
        priority: "high",
        notification: {
          title: "Final Order Rejected",
          body: message,
        },
        data: {
          type: "final_order_em",
          order_id: order.order_id,
          chat_id: order.quotation_id,
        },
      })
        .then((result) => {
          console.log(
            `FCM notifications sent to em ${order.em_id} for final order rejection ${order.order_id}`,
            result,
          );
        })
        .catch((error) => {
          console.error(
            "Failed to send FCM notification for final order rejection:",
            error,
          );
        });

      //Trigger for fcm for vendor app for final order
      sendFCMNotificationToVendor({
        vendorId: order.vendor_id,
        priority: "high",
        notification: {
          title: "Final Order Rejected",
          body: `Final Order marked for discussion by ${userType}. (Order ID: ${order.order_id})`,
        },
        data: {
          type: "final_order_rejected",
          order_id: order.order_id,
          chat_id: order.quotation_id,
        },
      })
        .then((result) => {
          console.log(
            `FCM notifications sent to vendor ${order.vendor_id} for final order rejection ${order.order_id}`,
            result,
          );
        })
        .catch((error) => {
          console.error(
            "Failed to send FCM notification for final order rejection:",
            error,
          );
        });

      const resetOrder = await Order.findOneAndUpdate(
        { order_id },
        { $set: { customer_approval: null, vendor_approval: null } },
        { new: true },
      );

      return res.status(200).json({
        message:
          "Approval rejected by one party. Order reset for future approvals.",
        data: resetOrder,
      });
    }

    // 🟡 CASE 3: Only one party approved
    const parsedFinalPrice = Number(String(order.price || 0).replace(/,/g, ""));
    const checkout_url =
      order.checkout_url ||
      `/checkout?amount=${parsedFinalPrice}&vendor_id=${order.vendor_id}&user_id=${order.customer_id}&orderId=${order.order_id}`;

    const message = `🟡 Final Order approved by ${userType}. Waiting for other party to respond (Order ID: ${order.order_id})`;

    await vendorNotification.create({
      vendor_id: order.vendor_id,
      order_id: order.order_id,
      chat_id: order.quotation_id,
      service_id: order.service_id,
      notification_type: "chat_message",
      message,
    });

    await adminNotification.create({
      order_id: order.order_id,
      chat_id: order.quotation_id,
      em_id: order.em_id,
      notification_type: "chat_message",
      message,
    });

    await customerNotification.findOneAndUpdate(
      {
        customer_id: order.customer_id,
        order_id: order.order_id,
        notification_type: "chat_message",
      },
      {
        $set: {
          final_amount: parsedFinalPrice,
          checkout_url,
          message,
          chat_id: order.quotation_id,
          quotation_id: order.quotation_id,
        },
      },
      { new: true, upsert: true },
    );

    //Trigger for fcm for em in app for final order
    sendFCMNotificationToEm({
      emId: order.em_id,
      priority: "high",
      notification: {
        title: "Final Order Updated",
        body: message,
      },
      data: {
        type: "final_order_em",
        order_id: order.order_id,
        chat_id: order.quotation_id,
      },
    })
      .then((result) => {
        console.log(
          `FCM notifications sent to em ${order.em_id} for partial order approval ${order.order_id}`,
          result,
        );
      })
      .catch((error) => {
        console.error(
          "Failed to send FCM notification for partial order approval:",
          error,
        );
      });

    //Trigger for fcm for vendor app for final order
    sendFCMNotificationToVendor({
      vendorId: order.vendor_id,
      priority: "high",
      notification: {
        title: "Final Order Updated",
        body: `Final Order approved by ${userType}. Waiting for other party to respond (Order ID: ${order.order_id})`,
      },
      data: {
        type: "final_order_partial_approval",
        order_id: order.order_id,
        chat_id: order.quotation_id,
      },
    })
      .then((result) => {
        console.log(
          `FCM notifications sent to vendor ${order.vendor_id} for partial order approval ${order.order_id}`,
          result,
        );
      })
      .catch((error) => {
        console.error(
          "Failed to send FCM notification for partial order approval:",
          error,
        );
      });

    return res.status(200).json({
      message: `Approval updated for ${userType}. Checkout link temporarily sent.`,
      data: order,
      checkout_url,
    });
  } catch (error) {
    console.error("🔥 Approval update error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ---------------------- UPDATE FINAL ORDER ----------------------
export const updateFinalOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { paymentDetails, specificTerms, paymentBreakdowns, ...updateData } =
      req.body;

    // Handle paymentDetails and specificTerms separately to ensure proper schema validation
    const updateFields = { ...updateData };
    if (paymentDetails) {
      updateFields.paymentDetails = paymentDetails;
    }
    if (paymentBreakdowns) {
      updateFields.paymentBreakdowns = paymentBreakdowns;
    }
    if (specificTerms) {
      updateFields.specificTerms = specificTerms;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { order_id },
      { $set: updateFields },
      { new: true },
    );
    if (!updatedOrder)
      return res.status(404).json({ message: "Booking not found" });

    res
      .status(200)
      .json({ message: "Booking updated successfully", data: updatedOrder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update booking", error: error.message });
  }
};

// ---------------------- GET ORDERS BY VENDOR ----------------------
export const getOrdersByVendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const orders = await Order.find({ vendor_id });
    if (!orders.length)
      return res.status(404).json({ message: "No bookings found" });

    res
      .status(200)
      .json({ message: "Bookings retrieved successfully", data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

// ---------------------- GET ORDERS BY CUSTOMER ----------------------
export const getOrdersByCustomer = async (req, res) => {
  try {
    const orders = await Order.find({ customer_id: req.params.customer_id });
    if (!orders.length)
      return res.status(404).json({ message: "No bookings found" });

    res
      .status(200)
      .json({ message: "Bookings retrieved successfully", data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

// ---------------------- GET ORDER BY ID ----------------------
export const getOrderById = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await Order.findOne({ order_id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res
      .status(200)
      .json({ message: "Booking retrieved successfully", data: [order] });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch booking", error: error.message });
  }
};

// ---------------------- UPDATE PAYMENT DETAILS ----------------------
export const updatePaymentDetails = async (req, res) => {
  try {
    const { order_id } = req.params;
    const paymentDetails = req.body;

    // Validate required payment details fields
    if (!paymentDetails.paymentMethod || !paymentDetails.paymentStatus) {
      return res.status(400).json({
        message: "paymentMethod and paymentStatus are required",
      });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { order_id },
      { $set: { paymentDetails } },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Payment details updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Failed to update payment details:", error);
    res.status(500).json({
      message: "Failed to update payment details",
      error: error.message,
    });
  }
};

// ---------------------- UPDATE SPECIFIC TERMS ----------------------
export const updateSpecificTerms = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { specificTerms } = req.body;

    // Validate that specificTerms is an array
    if (!Array.isArray(specificTerms)) {
      return res.status(400).json({
        message: "specificTerms must be an array of strings",
      });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { order_id },
      { $set: { specificTerms } },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Specific terms updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Failed to update specific terms:", error);
    res.status(500).json({
      message: "Failed to update specific terms",
      error: error.message,
    });
  }
};

// ---------------------- SYNC PAYMENT DETAILS TO EVENTS ----------------------
export const syncPaymentDetailsToEvents = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { paymentDetails, payment_method_details } = req.body;

    // Get the order to find the associated event
    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the associated event using customer_id and vendor_id
    const event = await Events.findOne({
      customer_id: order.customer_id,
      vendor_id: order.vendor_id,
      event_start: order.event_start,
      event_end: order.event_end,
    });

    if (!event) {
      return res.status(404).json({ message: "Associated event not found" });
    }

    // Update the event with payment details
    const updateFields = {};
    if (paymentDetails) {
      updateFields.paymentDetails = paymentDetails;
    }
    if (payment_method_details) {
      updateFields.payment_method_details = payment_method_details;
    }

    const updatedEvent = await Events.findOneAndUpdate(
      { event_id: event.event_id },
      { $set: updateFields },
      { new: true },
    );

    res.status(200).json({
      message: "Payment details synced to event successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Failed to sync payment details to events:", error);
    res.status(500).json({
      message: "Failed to sync payment details to events",
      error: error.message,
    });
  }
};

// ---------------------- DELETE ORDER ----------------------
export const deleteFinalOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const deletedOrder = await Order.findOneAndDelete({ order_id });
    if (!deletedOrder)
      return res.status(404).json({ message: "Booking not found" });

    res
      .status(200)
      .json({ message: "Booking deleted successfully", data: deletedOrder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete booking", error: error.message });
  }
};

// ---------------------- DELETE APPROVAL (Migration DB) ----------------------
export const deleteApprovalForOrder = async (req, res) => {
  try {
    const { quotation_id, order_id, admin_id } = req.body;
    console.log("🔵 deleteApprovalForOrder:", req.body);

    if (!admin_id || !admin_id.startsWith("EM")) {
      return res.status(403).json({ message: "Unauthorized. Admin only." });
    }

    if (!quotation_id || !order_id) {
      return res
        .status(400)
        .json({ message: "quotation_id and order_id are required" });
    }

    // Delete approval messages (both vendor-admin & customer-admin)
    const deletedMessages = await Message.deleteMany({
      chat_id: quotation_id,
      message_type: "approval_request",
    });

    console.log("Deleted approval messages:", deletedMessages);

    // Delete the final order
    const deletedOrder = await Order.findOneAndDelete({ order_id });

    console.log("Deleted order ❌:", deletedOrder);

    res.status(200).json({
      message: "Approval messages and order deleted successfully",
      deletedMessages,
      deletedOrder,
    });
  } catch (error) {
    console.error("🔥 deleteApproval error:", error.message);
    return res.status(500).json({
      message: "Failed to delete approval data",
      error: error.message,
    });
  }
};
