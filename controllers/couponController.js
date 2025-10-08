import { Vendor } from '../models/users.js';
import { Coupon } from '../models/coupon.js';
import { CustomerCoupon } from '../models/customerCoupon.js';
import { Customer } from '../models/customer.js';

// Helper function to calculate new discount eligibility
const calculateNewEligibility = (currentEligibility, usedDiscount) => {
  let newEligibility = [];

  switch (usedDiscount) {
    case 100:
      // Cannot use any coupon in future
      newEligibility = [];
      break;
    case 50:
      // Can only use 25% in future
      newEligibility = currentEligibility.filter(discount => discount === 25);
      break;
    case 25:
      // Cannot use any coupon in future
      newEligibility = [];
      break;
    default:
      newEligibility = currentEligibility;
  }

  return newEligibility;
};

// Helper function to get eligibility message
const getEligibilityMessage = (eligibleDiscounts) => {
  if (eligibleDiscounts.length === 0) {
    return 'You cannot use any more coupons in the future';
  }
  return `You can use ${eligibleDiscounts.join(', ')}% discount coupons in the future`;
};

// Get available coupons for a vendor
export const getAvailableCoupons = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findOne({ id: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Get all active coupons
    const allCoupons = await Coupon.find({ isActive: true });

    // Filter based on vendor's eligibility
    const availableCoupons = allCoupons.filter(coupon =>
      vendor.couponDetails.canUseDiscounts.includes(coupon.discount)
    );

    res.json({
      success: true,
      data: {
        availableCoupons,
        vendorEligibility: {
          canUse: vendor.couponDetails.canUseDiscounts,
          highestUsed: vendor.couponDetails.highestDiscountUsed,
          totalCouponsUsed: vendor.couponDetails.appliedCoupons.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting available coupons:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { vendorId, couponCode, couponDetails } = req.body;

    // Validate inputs
    if (!vendorId || !couponCode || !couponDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vendorId, couponCode, couponDetails'
      });
    }

    // Validate couponDetails structure
    if (
      couponDetails.finalAmount === undefined ||
      couponDetails.finalAmount === null ||
      couponDetails.savings === undefined ||
      couponDetails.savings === null ||
      couponDetails.discount === undefined ||
      couponDetails.discount === null
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid couponDetails structure'
      });
    }

    // Find vendor
    const vendor = await Vendor.findOne({ id: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Find coupon (for verification)
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true
    });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or inactive coupon code'
      });
    }

    // Verify coupon details match
    if (coupon.discount !== couponDetails.discount) {
      return res.status(400).json({
        success: false,
        error: 'Coupon details mismatch. Please revalidate the coupon.'
      });
    }

    // Check if vendor can still use this discount level
    if (!vendor.couponDetails.canUseDiscounts.includes(coupon.discount)) {
      return res.status(403).json({
        success: false,
        error: `You cannot use ${coupon.discount}% discount coupons`,
        availableDiscounts: vendor.couponDetails.canUseDiscounts
      });
    }

    // Calculate original amount from frontend data
    const originalAmount = couponDetails.finalAmount + couponDetails.savings;

    // Update vendor's coupon eligibility
    const updatedCanUseDiscounts = calculateNewEligibility(
      vendor.couponDetails.canUseDiscounts,
      coupon.discount
    );

    // Create coupon usage record using frontend calculated data
    const couponUsage = {
      couponCode: coupon.code,
      discount: coupon.discount,
      appliedAt: new Date(),
      originalAmount,
      discountAmount: couponDetails.savings,
      finalAmount: couponDetails.finalAmount
    };

    // Update vendor with nested couponDetails structure
    await Vendor.findOneAndUpdate(
      { id: vendorId },
      {
        $push: { 'couponDetails.appliedCoupons': couponUsage },
        $set: {
          'couponDetails.highestDiscountUsed': Math.max(vendor.couponDetails.highestDiscountUsed, coupon.discount),
          'couponDetails.canUseDiscounts': updatedCanUseDiscounts
        }
      }
    );

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        couponDetails: {
          code: coupon.code,
          discount: coupon.discount,
          team: coupon.team
        },
        paymentDetails: {
          originalAmount,
          discountAmount: couponDetails.savings,
          finalAmount: couponDetails.finalAmount,
          discountPercentage: coupon.discount,
          savings: couponDetails.savings
        },
        futureEligibility: {
          canUseDiscounts: updatedCanUseDiscounts,
          message: getEligibilityMessage(updatedCanUseDiscounts)
        }
      }
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get vendor's coupon history
export const getCouponHistory = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findOne({ id: vendorId })
      .select('couponDetails name');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Calculate total savings
    const totalSavings = vendor.couponDetails.appliedCoupons.reduce(
      (sum, coupon) => sum + coupon.discountAmount,
      0
    );

    res.json({
      success: true,
      data: {
        vendorName: vendor.name,
        couponHistory: vendor.couponDetails.appliedCoupons,
        currentStatus: {
          highestDiscountUsed: vendor.couponDetails.highestDiscountUsed,
          canUseDiscounts: vendor.couponDetails.canUseDiscounts,
          totalCouponsUsed: vendor.couponDetails.appliedCoupons.length,
          totalSavings,
          eligibilityMessage: getEligibilityMessage(vendor.couponDetails.canUseDiscounts)
        }
      }
    });
  } catch (error) {
    console.error('Error getting coupon history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Validate coupon before applying (for frontend validation)
export const validateCoupon = async (req, res) => {
  try {
    const { vendorId, couponCode, originalAmount } = req.body;

    // Validate required fields
    if (!vendorId || !couponCode || !originalAmount) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'vendorId, couponCode, and originalAmount are required'
      });
    }

    // Validate original amount
    if (originalAmount <= 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Original amount must be greater than 0'
      });
    }

    const vendor = await Vendor.findOne({ id: vendorId });
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Vendor not found'
      });
    }

    if (!coupon) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Invalid or inactive coupon code'
      });
    }

    const canUse = vendor.couponDetails.canUseDiscounts.includes(coupon.discount);

    // Calculate pricing details if coupon is valid
    let pricingDetails = null;
    if (canUse) {
      const discountAmount = (originalAmount * coupon.discount) / 100;
      const finalAmount = originalAmount - discountAmount;

      pricingDetails = {
        originalAmount,
        discountPercentage: coupon.discount,
        discountAmount,
        finalAmount,
        savings: discountAmount
      };
    }

    res.json({
      success: true,
      valid: canUse,
      data: {
        coupon: canUse ? {
          code: coupon.code,
          discount: coupon.discount,
          team: coupon.team
        } : null,
        pricing: pricingDetails,
        message: canUse
          ? `Valid! ${coupon.discount}% discount from ${coupon.team} team - Save ₹${pricingDetails.savings}`
          : `You cannot use ${coupon.discount}% discount coupons. Available: ${vendor.couponDetails.canUseDiscounts.join(', ')}%`,
        vendorEligibility: {
          canUse: vendor.couponDetails.canUseDiscounts,
          highestUsed: vendor.couponDetails.highestDiscountUsed,
          reason: !canUse ? `You have already used a ${vendor.couponDetails.highestDiscountUsed}% discount coupon` : null
        }
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: error.message
    });
  }
};

// Remove/deactivate a coupon (admin function)
export const deactivateCoupon = async (req, res) => {
  try {
    const { couponCode } = req.params;

    const coupon = await Coupon.findOneAndUpdate(
      { code: couponCode.toUpperCase() },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: `Coupon ${coupon.code} has been deactivated`,
      data: coupon
    });
  } catch (error) {
    console.error('Error deactivating coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all coupons (admin function)
export const getAllCoupons = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const coupons = await Coupon.find(filter).sort({ team: 1, discount: -1 });

    res.json({
      success: true,
      data: {
        coupons,
        count: coupons.length
      }
    });
  } catch (error) {
    console.error('Error getting all coupons:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


export const getAvailableCouponsForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    const allCoupons = await CustomerCoupon.find({ isActive: true });
    const availableCoupons = allCoupons.filter((c) =>
      customer.couponDetails.canUseDiscounts.includes(c.discount)
    );

    return res.json({
      success: true,
      data: {
        availableCoupons,
        customerEligibility: {
          canUse: customer.couponDetails.canUseDiscounts,
          highestUsed: customer.couponDetails.highestDiscountUsed,
          totalCouponsUsed: customer.couponDetails.appliedCoupons.length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting available coupons (customer):", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/coupons/customers/validate
// Body: { customerId, couponCode, convenienceFee, currentTotal }
// Rule: discount applies ONLY on convenienceFee, and reduces currentTotal by that amount
// controllers/customerCouponController.js (validate)
export const validateCouponForCustomer = async (req, res) => {
  try {
    const { customerId, couponCode, convenienceFee, currentTotal } = req.body;

    if (!customerId || !couponCode || convenienceFee == null || currentTotal == null) {
      return res.status(400).json({
        success: false, valid: false,
        error: "customerId, couponCode, convenienceFee, and currentTotal are required",
      });
    }

    const customer = await Customer.findOne({ id: customerId });
    if (!customer) return res.status(404).json({ success: false, valid: false, error: "Customer not found" });

    const coupon = await CustomerCoupon.findOne({ code: String(couponCode).toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, valid: false, error: "Invalid or inactive coupon code" });

    const canUse = customer.couponDetails.canUseDiscounts.includes(coupon.discount);

    let pricingDetails = null;
    if (canUse) {
      const fee = Math.max(0, Number(convenienceFee) || 0);
      const total = Math.max(0, Number(currentTotal) || 0);
      const rawDiscount = (fee * coupon.discount) / 100;
      const discountAmount = Math.min(rawDiscount, fee);
      const finalAmount = Math.max(0, total - discountAmount);

      pricingDetails = {
        originalAmount: total,
        discountPercentage: coupon.discount,
        discountAmount,
        finalAmount,
        savings: discountAmount,
      };
    }

    return res.json({
      success: true,
      valid: canUse,
      data: {
        coupon: canUse ? { code: coupon.code, discount: coupon.discount, team: coupon.team } : null,
        pricing: pricingDetails,
        message: canUse
          ? `Valid! ${coupon.discount}% off convenience fee - Save ₹${pricingDetails.savings}`
          : `You cannot use ${coupon.discount}% discount coupons. Available: ${customer.couponDetails.canUseDiscounts.join(", ")}%`,
        customerEligibility: {
          canUse: customer.couponDetails.canUseDiscounts,
          highestUsed: customer.couponDetails.highestDiscountUsed,
          reason: !canUse ? `You have already used a ${customer.couponDetails.highestDiscountUsed}% discount coupon` : null,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, valid: false, error: error.message });
  }
};


// POST /api/coupons/customers/apply
// Body: { customerId, couponCode, couponDetails: { code, discount, finalAmount, savings } }
// Note: originalAmount = finalAmount + savings (final total context), usage embedded on Customer
export const applyCouponForCustomer = async (req, res) => {
  try {
    const { customerId, couponCode, couponDetails } = req.body;

    if (!customerId || !couponCode || !couponDetails) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customerId, couponCode, couponDetails",
      });
    }
    const { finalAmount, savings, discount } = couponDetails || {};
    if (finalAmount == null || savings == null || discount == null) {
      return res.status(400).json({
        success: false,
        error: "Invalid couponDetails structure",
      });
    }

    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    const coupon = await CustomerCoupon.findOne({
      code: String(couponCode).toUpperCase(),
      isActive: true,
    });
    if (!coupon) {
      return res.status(404).json({ success: false, error: "Invalid or inactive coupon code" });
    }

    if (coupon.discount !== discount) {
      return res.status(400).json({
        success: false,
        error: "Coupon details mismatch. Please revalidate the coupon.",
      });
    }

    if (!customer.couponDetails.canUseDiscounts.includes(coupon.discount)) {
      return res.status(403).json({
        success: false,
        error: `You cannot use ${coupon.discount}% discount coupons`,
        availableDiscounts: customer.couponDetails.canUseDiscounts,
      });
    }

    const originalAmount = Number(finalAmount) + Number(savings);

    const updatedCanUseDiscounts = calculateNewEligibility(
      customer.couponDetails.canUseDiscounts,
      coupon.discount
    );

    const couponUsage = {
      couponCode: coupon.code,
      discount: coupon.discount,
      appliedAt: new Date(),
      originalAmount,
      discountAmount: Number(savings),
      finalAmount: Number(finalAmount),
    };

    await Customer.findOneAndUpdate(
      { id: customerId },
      {
        $push: { "couponDetails.appliedCoupons": couponUsage },
        $set: {
          "couponDetails.highestDiscountUsed": Math.max(
            customer.couponDetails.highestDiscountUsed,
            coupon.discount
          ),
          "couponDetails.canUseDiscounts": updatedCanUseDiscounts,
        },
      }
    );

    return res.json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        couponDetails: {
          code: coupon.code,
          discount: coupon.discount,
          team: coupon.team,
        },
        paymentDetails: {
          originalAmount,
          discountAmount: Number(savings),
          finalAmount: Number(finalAmount),
          discountPercentage: coupon.discount,
          savings: Number(savings),
        },
        futureEligibility: {
          canUseDiscounts: updatedCanUseDiscounts,
          message: getEligibilityMessage(updatedCanUseDiscounts),
        },
      },
    });
  } catch (error) {
    console.error("Error applying coupon (customer):", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/coupons/customers/history/:customerId
export const getCustomerCouponHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ id: customerId }).select("couponDetails name");
    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    const totalSavings = customer.couponDetails.appliedCoupons.reduce(
      (sum, c) => sum + c.discountAmount,
      0
    );

    return res.json({
      success: true,
      data: {
        customerName: customer.name,
        couponHistory: customer.couponDetails.appliedCoupons,
        currentStatus: {
          highestDiscountUsed: customer.couponDetails.highestDiscountUsed,
          canUseDiscounts: customer.couponDetails.canUseDiscounts,
          totalCouponsUsed: customer.couponDetails.appliedCoupons.length,
          totalSavings,
          eligibilityMessage: getEligibilityMessage(customer.couponDetails.canUseDiscounts),
        },
      },
    });
  } catch (error) {
    console.error("Error getting coupon history (customer):", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};