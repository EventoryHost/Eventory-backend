import Order from "../models/orders.js";
import { Events } from "../models/events.js";
import customerNotification from "../models/customerNotifications.js";
import vendorNotification from "../models/vendorNotifications.js";
import adminNotification from "../models/emNotifications.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import { sendFCMNotificationToVendor } from "../utils/firebaseNotificationUtils.js";
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
      ...incomingData
    } = req.body;

    let finalCustomerId = incomingData.customer_id;

    // 🆕 HANDLE NEW CUSTOMER CREATION IF NO CUSTOMER ID
    // 🆕 HANDLE CUSTOMER LOOKUP
    // Only look up if customer_id is explicitly missing/null OR it looks like a temporary ID
    const isTempId = finalCustomerId && (finalCustomerId.startsWith("NEW_") || finalCustomerId === "gen_user_id");

    if ((!finalCustomerId || isTempId) && customer_contact_number) {
      console.log("🆕 Checking for existing customer by number:", customer_contact_number);

      // Normalize number if needed (basic strip for now, assuming standard format)
      // const normalizedNumber = normalizePhoneNumber(customer_contact_number); 

      let existingCustomer = await Customer.findOne({ contact_number: customer_contact_number });

      if (existingCustomer) {
        console.log("✅ Found existing customer:", existingCustomer.customer_id);
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
      console.warn("⚠️ Proceeding without customer_id (migrated legacy behavior or error)");
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

      console.log("🗑️ Deleted approval_request messages:", deletedMessages.deletedCount);

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
    if (specificTerms) updateFields.specificTerms = specificTerms;
    if (em_id) updateFields.em_id = em_id;

    // UPSERT THE ORDER
    // UPSERT OR CREATE ORDER
    let updatedOrder;
    if (order_id) {
      console.log("🔄 Updating existing order:", order_id);
      updatedOrder = await Order.findOneAndUpdate(
        { order_id },
        { $set: updateFields },
        { new: true, upsert: true } // Upsert is fine if order_id is valid but not found (rare)
      );
    } else {
      console.log("✨ Creating FRESH order (no order_id provided)");
      // Create new order instance to trigger default order_id generation
      updatedOrder = await Order.create(updateFields);
    }

    console.log("✅ Final order saved:", updatedOrder.order_id);

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
            chat_type: "customer-admin"
          });

          // Vendor Room (if different chat_type needed, create another message or just emit)
          // Usually approval request goes to both
          const vendorRoomId = `${targetChatId}-vendor-admin`;
          req.io.to(vendorRoomId).emit("new_message", {
            ...savedMessage.toObject(),
            chat_type: "vendor-admin"
          });

          console.log(`📤 Emitted approval_request to ${customerRoomId} and ${vendorRoomId}`);
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
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ CASE 1: Both parties approved
    if (order.customer_approval === true && order.vendor_approval === true) {
      console.log("CASE 1 triggered for order:", order.order_id);
      const parsedFinalPrice = Number(
        String(order.price || 0).replace(/,/g, "")
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
        { new: true, upsert: true }
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

      //Trigger for fcm for vendor app for final order
      sendFCMNotificationToVendor({
        vendorId: order.vendor_id,
        priority: "high",
        notification: {
          title: "Final Order Approved",
          body: `Final Order Approved by both Vendor and Customer. (Order ID: ${order.order_id})`
        },
        data: {
          type: "final_order_approved",
          order_id: order.order_id,
          chat_id: order.quotation_id,
          quotation_id: order.quotation_id,
          customer_id: order.customer_id,
        }
      }).then(result => {
        console.log(`FCM notifications sent to vendor ${order.vendor_id} for final order approval ${order.order_id}`, result);
      }).catch(error => {
        console.error("Failed to send FCM notification for final order approval:", error);
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
                  chat_updated_at: new Date()
                }
              }
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

          console.log("✅ Chat message sent to customer-admin chat for payment");
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

      //Trigger for fcm for vendor app for final order
      sendFCMNotificationToVendor({
        vendorId: order.vendor_id,
        priority: "high",
        notification: {
          title: "Final Order Rejected",
          body: `Final Order marked for discussion by ${userType}. (Order ID: ${order.order_id})`
        },
        data: {
          type: "final_order_rejected",
          order_id: order.order_id,
          chat_id: order.quotation_id,
        }
      }).then(result => {
        console.log(`FCM notifications sent to vendor ${order.vendor_id} for final order rejection ${order.order_id}`, result);
      }).catch(error => {
        console.error("Failed to send FCM notification for final order rejection:", error);
      });

      const resetOrder = await Order.findOneAndUpdate(
        { order_id },
        { $set: { customer_approval: null, vendor_approval: null } },
        { new: true }
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
      { new: true, upsert: true }
    );

    //Trigger for fcm for vendor app for final order
    sendFCMNotificationToVendor({
      vendorId: order.vendor_id,
      priority: "high",
      notification: {
        title: "Final Order Updated",
        body: `Final Order approved by ${userType}. Waiting for other party to respond (Order ID: ${order.order_id})`
      },
      data: {
        type: "final_order_partial_approval",
        order_id: order.order_id,
        chat_id: order.quotation_id,
      }
    }).then(result => {
      console.log(`FCM notifications sent to vendor ${order.vendor_id} for partial order approval ${order.order_id}`, result);
    }).catch(error => {
      console.error("Failed to send FCM notification for partial order approval:", error);
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
    const { paymentDetails, specificTerms, ...updateData } = req.body;

    // Handle paymentDetails and specificTerms separately to ensure proper schema validation
    const updateFields = { ...updateData };
    if (paymentDetails) {
      updateFields.paymentDetails = paymentDetails;
    }
    if (specificTerms) {
      updateFields.specificTerms = specificTerms;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { order_id },
      { $set: updateFields },
      { new: true }
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
      { new: true }
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
      { new: true }
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
      { new: true }
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
