import SpookyGala from "../models/spookyGala.js";
import generateUniqueId from "../utils/generateId.js";

// Create a new Spooky Gala order
export const createSpookyGalaOrder = async (req, res) => {
  try {
    const {
      customerEmail,
      quantity,
      basePrice = 1000,
      taxRate = 0.18
    } = req.body;

    // Validation
    if (!customerEmail || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Customer email and quantity are required"
      });
    }

    if (quantity < 1 || quantity > 499) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 499"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Calculate amounts
    const subtotal = quantity * basePrice;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Create order
    const spookyGalaOrder = new SpookyGala({
      customerEmail,
      quantity,
      basePrice,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paymentStatus: "pending"
    });

    await spookyGalaOrder.save();

    res.status(201).json({
      success: true,
      message: "Spooky Gala order created successfully",
      data: {
        orderId: spookyGalaOrder.orderId,
        customerEmail: spookyGalaOrder.customerEmail,
        quantity: spookyGalaOrder.quantity,
        subtotal: spookyGalaOrder.subtotal,
        taxAmount: spookyGalaOrder.taxAmount,
        totalAmount: spookyGalaOrder.totalAmount,
        paymentStatus: spookyGalaOrder.paymentStatus,
        createdAt: spookyGalaOrder.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating Spooky Gala order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get Spooky Gala order by ID
export const getSpookyGalaOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await SpookyGala.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Spooky Gala order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error("Error fetching Spooky Gala order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all Spooky Gala orders (admin)
export const getAllSpookyGalaOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await SpookyGala.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SpookyGala.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching Spooky Gala orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      paymentStatus, 
      cashfreeOrderId, 
      paymentMethod, 
      transactionId 
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const updateData = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (cashfreeOrderId) updateData["paymentDetails.cashfreeOrderId"] = cashfreeOrderId;
    if (paymentMethod) updateData["paymentDetails.paymentMethod"] = paymentMethod;
    if (transactionId) updateData["paymentDetails.transactionId"] = transactionId;
    
    if (paymentStatus === "paid") {
      updateData["paymentDetails.paidAt"] = new Date();
    }

    const order = await SpookyGala.findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Spooky Gala order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: order
    });

  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get orders by customer email
export const getOrdersByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const orders = await SpookyGala.find({ customerEmail: email })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Error fetching orders by email:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await SpookyGala.findOneAndUpdate(
      { orderId },
      { 
        $set: { 
          status: "cancelled",
          paymentStatus: "refunded"
        } 
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Spooky Gala order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order
    });

  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get statistics
export const getSpookyGalaStats = async (req, res) => {
  try {
    const totalOrders = await SpookyGala.countDocuments();
    const paidOrders = await SpookyGala.countDocuments({ paymentStatus: "paid" });
    const pendingOrders = await SpookyGala.countDocuments({ paymentStatus: "pending" });
    const totalRevenue = await SpookyGala.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const totalPassesSold = await SpookyGala.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        paidOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalPassesSold: totalPassesSold[0]?.total || 0,
        averageOrderValue: paidOrders > 0 ? (totalRevenue[0]?.total || 0) / paidOrders : 0
      }
    });

  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
