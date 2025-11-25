import express from "express";
import Order from "../models/finalOrders.js";
import customerNotification from "../models/customerNotification.js";
import vendorNotification from "../models/vendorNotification.js";
import adminNotification from "../models/adminNotification.js";
import { Quotation } from "../models/quotation.js";
import { Customer } from "../models/customer.js";
import Chat from "../models/chat.js";
import message from "../models/message.js";

const router = express.Router();

/**
 * @swagger
 * /api/finalOrder:
 *   post:
 *     summary: Create or update a final order
 *     tags:
 *       - Final Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "ORD123456"
 *               finalPrice:
 *                 type: string
 *                 example: "4999"
 *               vendorId:
 *                 type: string
 *                 example: "ven20250807122031748"
 *               customerName:
 *                 type: string
 *                 example: "John Doe"
 *               customerContact:
 *                 type: string
 *                 example: "+91-9876543210"
 *               serviceDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-15"
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DJ", "Photography"]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed]
 *                 example: "completed"
 *               notes:
 *                 type: string
 *                 example: "Please arrive an hour early."
 *     responses:
 *       200:
 *         description: Order processed successfully
 *       400:
 *         description: Failed to process booking
 */

router.post("/finalOrder", async (req, res) => {
  try {
    const { orderId, _id, __v, createdAt, updatedAt, ...incomingData } =
      req.body;

    console.log("🔵 Received order data:", incomingData);

    // 🧹 1️⃣ DELETE OLD APPROVAL MESSAGES FOR THIS ORDER (BOTH CHATS)
    await message.deleteMany({
      chatId: incomingData.quotationId,              // Your chatId === orderId / quotationId
      contentType: "approval_request",
    });

    console.log("🗑️ Old approval messages removed for chat:", orderId);

    // 🧠 2️⃣ BUILD SAFE UPDATE OBJECT
    const updateData = {};

    for (const key of Object.keys(incomingData)) {
      if (
        typeof incomingData[key] !== "object" ||
        Array.isArray(incomingData[key])
      ) {
        updateData[key] = incomingData[key];
      }
    }

    if (incomingData.paymentDetails) {
      updateData["paymentDetails"] = { ...incomingData.paymentDetails };
    }
    if (incomingData.approvals) {
      updateData["approvals"] = { ...incomingData.approvals };
    }
    if (incomingData.lastAction) {
      updateData["lastAction"] = { ...incomingData.lastAction };
    }

    // 📝 3️⃣ UPSERT ORDER
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    // ✅ 4️⃣ RESPONSE
    res.status(200).json({
      message: "Order processed successfully",
      data: updatedOrder,
    });

  } catch (error) {
    console.error("❌ Failed to process order:", error);
    res.status(400).json({
      message: "Failed to process booking",
      error: error.message,
    });
  }
});


/**
 * @swagger
 * /api/finalOrder:
 *   get:
 *     summary: Get all final orders
 *     tags:
 *       - Final Orders
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       500:
 *         description: Server error
 */
// Fetch all current finalOrders without any identifying field
router.get("/finalOrder", async (req, res) => {
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
});

/**
 * @swagger
 * /api/finalOrder/byQuotationId/{id}:
 *   get:
 *     summary: Get order by quotation ID
 *     tags:
 *       - Final Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 */

// backend route to find status of approvals using quotationId
router.get("/finalOrder/byQuotationId/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findOne({ quotationId: id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/finalOrder/approve:
 *   put:
 *     summary: Approve or reject final order
 *     tags:
 *       - Final Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               userType:
 *                 type: string
 *               value:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Approval updated
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */

// Approve or mark as needs discussion
router.put("/finalOrder/approve", async (req, res) => {
  console.log("🔵 Approve Route HIT");

  try {
    const { orderId, userType, value } = req.body;

    if (!orderId || !userType || typeof value !== "boolean") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updateField = {};
    updateField[`approvals.${userType}`] = value;

    // ✅ Also set lastAction info
    updateField["lastAction"] = { by: userType, value };

    // Update the approval field for the specific userType
    const order = await Order.findOneAndUpdate(
      { orderId },
      { $set: updateField },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    const { approvals } = order;

    // ✅ CASE 1: Both parties approved
    if (approvals.customer === true && approvals.vendor === true) {
      const parsedFinalPrice = Number(
        String(order.budget || order.finalPrice || 0).replace(/,/g, "")
      );

      const checkoutURL =
        order.finalURL ||
        `/checkout?amount=${parsedFinalPrice}&vendor_id=${order.vendorId}&user_id=${order.customerId}&orderId=${order.orderId}`;

      const message = `✅ Final Order Approved by both Vendor and Customer. (Order ID: ${order.orderId})`;

      // Customer Notification
      await customerNotification.create({
        customerId: order.customerId,
        orderId: order.orderId,
        vendorId: order.vendorId,
        message,
        quotationId: order.quotationId,
        type: "order_approved",
        checkoutURL,
      });

      console.log(
        `Both parties agreed ...... Sending Agreed Notification 🥳🥳🥳🥳🥳🥳🥳`
      );

      // Vendor Notification
      await vendorNotification.create({
        vendorId: order.vendorId,
        customerId: order.customerId,
        orderId: order.orderId,
        quotationId: order.quotationId,
        message,
        serviceId: order.service_id,
        type: "order_approved",
      });

      // Admin Notification
      await adminNotification.create({
        vendorId: order.vendorId,
        customerId: order.customerId,
        orderId: order.orderId,
        quotationId: order.quotationId,
        message,
      });

      try {
        const vendorAdminChat = await Chat.findOne({ 
          chatId: order.quotationId, 
          chatType: "vendor-admin" 
        });
        
        if (vendorAdminChat && vendorAdminChat.status !== "blocked") {
          vendorAdminChat.status = "blocked";
          await vendorAdminChat.save();
        }

        const customerAdminChat = await Chat.findOne({ 
          chatId: order.quotationId, 
          chatType: "customer-admin" 
        });
        
        if (customerAdminChat && customerAdminChat.status !== "blocked") {
          customerAdminChat.status = "blocked";
          await customerAdminChat.save();
        }
      } catch (chatError) {
        console.error("Error blocking chats:", chatError);
      }

      return res.status(200).json({
        message: "Final order approved by both parties.",
        data: order,
        checkoutURL,
      });
    }

    if (approvals.customer === false || approvals.vendor === false) {
      const message = ` Final Order marked for discussion by ${userType}. (Order ID: ${order.orderId})`;

      await vendorNotification.create({
        vendorId: order.vendorId,
        customerId: order.customerId,
        orderId: order.orderId,
        quotationId: order.quotationId,
        message,
        serviceId: order.service_id,
        type: "order_pending",
      });

      await adminNotification.create({
        vendorId: order.vendorId,
        customerId: order.customerId,
        orderId: order.orderId,
        quotationId: order.quotationId,
        message,
      });

      await customerNotification.create({
        customerId: order.customerId,
        vendorId: order.vendorId,
        orderId: order.orderId,
        quotationId: order.quotationId,
        message,
      });

      const resetOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            approvals: {
              customer: null,
              vendor: null,
            },
          },
        },
        { new: true }
      );

      return res.status(200).json({
        message:
          "Approval rejected by one party. Order reset for future approvals.",
        data: resetOrder,
      });
    }

    // 🟡 CASE 3: Only one party approved (replace the old CASE 3 block with this)
    if (
      (approvals.customer === true && approvals.vendor !== true) ||
      (approvals.vendor === true && approvals.customer !== true)
    ) {
      const parsedFinalPrice = Number(
        String(order.budget || order.finalPrice || 0).replace(/,/g, "")
      );

      const checkoutURL =
        order.finalURL ||
        `/checkout?amount=${parsedFinalPrice}&vendor_id=${order.vendorId}&user_id=${order.customerId}&orderId=${order.orderId}`;

      const message = `🟡 Final Order approved by ${userType}. Waiting for other party to respond (Order ID: ${order.orderId})`;

      // ✅ Always notify admin
      await adminNotification.create({
        vendorId: order.vendorId,
        customerId: order.customerId,
        orderId: order.orderId,
        quotationId: order.quotationId,
        message,
      });

      // Normalize userType just in case (optional but safer)
      const actor = String(userType).toLowerCase();

      if (actor === "vendor") {
        // Vendor approved -> notify CUSTOMER only (not vendor)
        await customerNotification.findOneAndUpdate(
          {
            customerId: order.customerId,
            orderId: order.orderId,
            vendorId: order.vendorId,
          },
          {
            $set: {
              finalPrice: parsedFinalPrice,
              checkoutURL,
              message,
              quotationId: order.quotationId,
            },
          },
          { new: true, upsert: true }
        );
      } else if (actor === "customer") {
        // Customer approved -> notify VENDOR only (not customer)
        await vendorNotification.create({
          vendorId: order.vendorId,
          customerId: order.customerId,
          orderId: order.orderId,
          quotationId: order.quotationId,
          message,
          serviceId: order.service_id,
          type: "order_pending",
        });
      } else {
        // fallback (shouldn't normally happen) -> notify the opposite party based on approvals
        if (approvals.vendor === true) {
          await customerNotification.findOneAndUpdate(
            {
              customerId: order.customerId,
              orderId: order.orderId,
              vendorId: order.vendorId,
            },
            {
              $set: {
                finalPrice: parsedFinalPrice,
                checkoutURL,
                message,
                quotationId: order.quotationId,
              },
            },
            { new: true, upsert: true }
          );
        } else if (approvals.customer === true) {
          await vendorNotification.create({
            vendorId: order.vendorId,
            customerId: order.customerId,
            orderId: order.orderId,
            quotationId: order.quotationId,
            message,
            serviceId: order.service_id,
            type: "order_pending",
          });
        }
      }

      return res.status(200).json({
        message: `Approval updated for ${userType}. Waiting for the other party.`,
        data: order,
        checkoutURL,
      });
    }
  } catch (error) {
    console.error("🔥 Approval update error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

/**
 * @swagger
 * /api/finalOrder/{orderId}:
 *   put:
 *     summary: Update final order by ID
 *     tags:
 *       - Final Orders
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       404:
 *         description: Booking not found
 */

// Update an existing booking (using vendorId and orderId)
router.put("/finalOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by orderId, not _id
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId }, // Use orderId to find the order
      req.body, // Update with the request body
      { new: true } // Return the updated order
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
});

/**
 * @swagger
 * /api/finalOrder/vendor/{vendorId}:
 *   get:
 *     summary: Get bookings for a vendor
 *     tags:
 *       - Final Orders
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookings retrieved
 *       404:
 *         description: No bookings found
 */

// Fetch all bookings for a vendor (by vendorId)
router.get("/finalOrder/vendor/:vendorId", async (req, res) => {
  try {
    // Find all orders for the vendorId
    const orders = await Order.find({ vendorId: req.params.vendorId });

    if (orders.length === 0)
      return res.status(404).json({ message: "No bookings found" });

    res
      .status(200)
      .json({ message: "Bookings retrieved successfully", data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
});

/**
 * @swagger
 * /api/finalOrder/customer/{customerId}:
 *   get:
 *     summary: Get bookings for a customer
 *     tags:
 *       - Final Orders
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookings retrieved
 *       404:
 *         description: No bookings found
 */

// Fetch all bookings for a customer (by customerId)
router.get("/finalOrder/customer/:customerId", async (req, res) => {
  try {
    // Find all orders for the customerId
    const orders = await Order.find({ customerId: req.params.customerId });

    if (orders.length === 0)
      return res.status(404).json({ message: "No bookings found" });

    res
      .status(200)
      .json({ message: "Bookings retrieved successfully", data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
});

/**
 * @swagger
 * /api/finalOrder/{orderId}:
 *   get:
 *     summary: Get booking by order ID
 *     tags:
 *       - Final Orders
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking retrieved
 *       404:
 *         description: Booking not found
 */

// Fetch a specific booking by orderId
router.get("/finalOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the specific order by orderId
    const order = await Order.find({ orderId: orderId });

    if (!order) return res.status(404).json({ message: "Booking not found" });

    res
      .status(200)
      .json({ message: "Booking retrieved successfully", data: order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch booking", error: error.message });
  }
});

/**
 * @swagger
 * /api/finalOrder/{orderId}:
 *   delete:
 *     summary: Delete booking by order ID
 *     tags:
 *       - Final Orders
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted
 *       404:
 *         description: Booking not found
 */

// Delete a booking (by orderId)
router.delete("/finalOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by orderId and delete it
    const deletedOrder = await Order.findOneAndDelete({ orderId: orderId });

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
});
// DELETE approval message + order (Admin only)
router.delete("/deleteApproval", async (req, res) => {
  try {
    console.log("DELETE BODY:", req.body);

    const { quotationId, orderId, adminId } = req.body;

    if (!adminId || !adminId.startsWith("EM")) {
      return res.status(403).json({ message: "Unauthorized. Admin only." });
    }

    if (!quotationId || !orderId) {
      return res.status(400).json({ message: "quotationId and orderId are required" });
    }

    const deletedMessages = await message.deleteMany({
      chatId: quotationId,
      contentType: "approval_request",
    });

    const deletedOrder = await Order.findOneAndDelete({ orderId });

    res.status(200).json({
      message: "Approval messages & order deleted successfully",
      deletedMessages: deletedMessages.deletedCount,
      deletedOrder,
    });

  } catch (error) {
    console.error("🔥 Delete approval error:", error);
    res.status(500).json({
      message: "Failed to delete approval data",
      error: error.message,
    });
  }
});


export default router;
