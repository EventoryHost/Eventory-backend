import express from "express";
import Order from "../models/finalOrders.js";

const router = express.Router();

router.post("/finalOrder", async (req, res) => {
    try {
        const { orderId, ...rest } = req.body;

        let order = await Order.findOneAndUpdate(
            { orderId },
            rest,
            { new: true, upsert: true } // upsert = create if not found
        );

        res.status(200).json({ message: 'Order processed successfully', data: order });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: 'Failed to process booking', error: error.message });
    }
});


// Fetch all current finalOrders without any identifying field
router.get("/finalOrder", async (req, res) => {
    try {
        const orders = await Order.find({});
        res.status(200).json({ message: "All orders retrieved successfully", data: orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
});

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


// Approve or mark as needs discussion
router.put("/finalOrder/approve", async (req, res) => {
  console.log("🔵 Approve Route HIT");

  try {
    console.log("🔵 Request Body:", req.body);

    const { orderId, userType, value } = req.body;

    if (!orderId || !userType || typeof value !== "boolean") {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updateField = {};
    updateField[`approvals.${userType}`] = value;

    console.log("🔍 Looking for orderId:", orderId);
    console.log("🛠 Update Field:", updateField);

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: updateField },
      { new: true }
    );

    console.log("✅ Found Order:", updatedOrder);

    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });

    return res.status(200).json({
      message: `Approval updated for ${userType}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("🔥 Approval update error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Update an existing booking (using vendorId and orderId)
router.put("/finalOrder/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        // Find the order by orderId, not _id
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },  // Use orderId to find the order
            req.body,               // Update with the request body
            { new: true }           // Return the updated order
        );

        if (!updatedOrder) return res.status(404).json({ message: "Booking not found" });

        res.status(200).json({ message: "Booking updated successfully", data: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: "Failed to update booking", error: error.message });
    }
});


// Fetch all bookings for a vendor (by vendorId)
router.get("/finalOrder/vendor/:vendorId", async (req, res) => {
    try {
        // Find all orders for the vendorId
        const orders = await Order.find({ vendorId: req.params.vendorId });

        if (orders.length === 0) return res.status(404).json({ message: "No bookings found" });

        res.status(200).json({ message: "Bookings retrieved successfully", data: orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
    }
});

// Fetch all bookings for a customer (by customerId)
router.get("/finalOrder/customer/:customerId", async (req, res) => {
    try {
        // Find all orders for the customerId
        const orders = await Order.find({ customerId: req.params.customerId });

        if (orders.length === 0) return res.status(404).json({ message: "No bookings found" });

        res.status(200).json({ message: "Bookings retrieved successfully", data: orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
    }
});

// Fetch a specific booking by orderId
router.get("/finalOrder/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        // Find the specific order by orderId
        const order = await Order.find({ orderId: orderId });

        if (!order) return res.status(404).json({ message: "Booking not found" });

        res.status(200).json({ message: "Booking retrieved successfully", data: order });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch booking", error: error.message });
    }
});

// Delete a booking (by orderId)
router.delete("/finalOrder/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        // Find the order by orderId and delete it
        const deletedOrder = await Order.findOneAndDelete({ orderId: orderId });

        if (!deletedOrder) return res.status(404).json({ message: "Booking not found" });

        res.status(200).json({ message: "Booking deleted successfully", data: deletedOrder });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete booking", error: error.message });
    }
});





export default router;
