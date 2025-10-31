import Order from "../models2/orders.js";
import { Events } from "../models2/events.js";
import customerNotification from "../models2/customerNotifications.js";
import vendorNotification from "../models2/vendorNotifications.js";
import adminNotification from "../models2/emNotifications.js";

// ---------------------- CREATE / UPSERT FINAL ORDER ----------------------
export const createOrUpdateFinalOrder = async (req, res) => {
  try {
    const { order_id, paymentDetails, specificTerms, ...updateData } = req.body;
    console.log("Received order data:", req.body);

    // Handle paymentDetails and specificTerms separately to ensure proper schema validation
    const updateFields = { ...updateData };
    if (paymentDetails) {
      updateFields.paymentDetails = paymentDetails;
    }
    if (specificTerms) {
      updateFields.specificTerms = specificTerms;
    }

    const order = await Order.findOneAndUpdate(
      { order_id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Order processed successfully", data: order });
  } catch (error) {
    console.error("Failed to process order:", error);
    res.status(400).json({ message: "Failed to process booking", error: error.message });
  }
};

// ---------------------- GET ALL FINAL ORDERS ----------------------
export const getAllFinalOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json({ message: "All orders retrieved successfully", data: orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// ---------------------- GET ORDER BY QUOTATION ID ----------------------
export const getOrderByQuotationId = async (req, res) => {
  const { quotation_id } = req.params;
  try {
    const order = await Order.findOne({ quotation_id });
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
      const parsedFinalPrice = Number(String(order.price || 0).replace(/,/g, ""));
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
        message,
      });

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

      const resetOrder = await Order.findOneAndUpdate(
        { order_id },
        { $set: { customer_approval: null, vendor_approval: null } },
        { new: true }
      );

      return res.status(200).json({
        message: "Approval rejected by one party. Order reset for future approvals.",
        data: resetOrder,
      });
    }

    // 🟡 CASE 3: Only one party approved
    const parsedFinalPrice = Number(String(order.price || 0).replace(/,/g, ""));
    console.log("CASE 3 triggered for order:", order.order_id);
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

    return res.status(200).json({
      message: `Approval updated for ${userType}. Checkout link temporarily sent.`,
      data: order,
      checkout_url,
    });
  } catch (error) {
    console.error("🔥 Approval update error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
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
    if (!updatedOrder) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking updated successfully", data: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Failed to update booking", error: error.message });
  }
};

// ---------------------- GET ORDERS BY VENDOR ----------------------
export const getOrdersByVendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const orders = await Order.find({ vendor_id });
    if (!orders.length) return res.status(404).json({ message: "No bookings found" });

    res.status(200).json({ message: "Bookings retrieved successfully", data: orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

// ---------------------- GET ORDERS BY CUSTOMER ----------------------
export const getOrdersByCustomer = async (req, res) => {
  try {
    const orders = await Order.find({ customer_id: req.params.customer_id });
    if (!orders.length) return res.status(404).json({ message: "No bookings found" });

    res.status(200).json({ message: "Bookings retrieved successfully", data: orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

// ---------------------- GET ORDER BY ID ----------------------
export const getOrderById = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await Order.find({ order_id });
    if (!order) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking retrieved successfully", data: order });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking", error: error.message });
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
        message: "paymentMethod and paymentStatus are required" 
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
      data: updatedOrder 
    });
  } catch (error) {
    console.error("Failed to update payment details:", error);
    res.status(500).json({ 
      message: "Failed to update payment details", 
      error: error.message 
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
        message: "specificTerms must be an array of strings" 
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
      data: updatedOrder 
    });
  } catch (error) {
    console.error("Failed to update specific terms:", error);
    res.status(500).json({ 
      message: "Failed to update specific terms", 
      error: error.message 
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
      event_end: order.event_end
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
      data: updatedEvent 
    });
  } catch (error) {
    console.error("Failed to sync payment details to events:", error);
    res.status(500).json({ 
      message: "Failed to sync payment details to events", 
      error: error.message 
    });
  }
};

// ---------------------- DELETE ORDER ----------------------
export const deleteFinalOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const deletedOrder = await Order.findOneAndDelete({ order_id });
    if (!deletedOrder) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking deleted successfully", data: deletedOrder });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete booking", error: error.message });
  }
};
