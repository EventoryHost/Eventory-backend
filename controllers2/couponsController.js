import { Vendor } from '../models2/vendor.js';
import Coupons from '../models2/coupons.js';

// Helper function to calculate new discount eligibility
const calculateNewEligibility = (currentEligibility, usedDiscount) => {
  let newEligibility = [];

  switch (usedDiscount) {
    case 100:
      newEligibility = [];
      break;
    case 50:
      newEligibility = currentEligibility.filter(d => d === 25);
      break;
    case 25:
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
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Get all active coupons
    const allCoupons = await Coupons.find({ is_active: true });

    // Filter based on vendor's eligibility
    const availableCoupons = allCoupons.filter(coupon =>
      vendor.couponDetails.canUseDiscounts.includes(coupon.coupon_value)
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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Apply coupon during payment
export const applyCoupon = async (req, res) => {
  try {
    const { vendorId, couponCode, couponDetails } = req.body;

    if (!vendorId || !couponCode || !couponDetails) {
      return res.status(400).json({ success: false, error: 'Missing required fields: vendorId, couponCode, couponDetails' });
    }

    if (
      couponDetails.finalAmount === undefined ||
      couponDetails.savings === undefined ||
      couponDetails.discount === undefined
    ) {
      return res.status(400).json({ success: false, error: 'Invalid couponDetails structure' });
    }

    const vendor = await Vendor.findOne({ id: vendorId });
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const coupon = await Coupons.findOne({
      coupon_code: couponCode.toUpperCase(),
      is_active: true
    });
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid or inactive coupon code' });
    }

    if (coupon.coupon_value !== couponDetails.discount) {
      return res.status(400).json({ success: false, error: 'Coupon details mismatch. Please revalidate the coupon.' });
    }

    if (!vendor.couponDetails.canUseDiscounts.includes(coupon.coupon_value)) {
      return res.status(403).json({
        success: false,
        error: `You cannot use ${coupon.coupon_value}% discount coupons`,
        availableDiscounts: vendor.couponDetails.canUseDiscounts
      });
    }

    const originalAmount = couponDetails.finalAmount + couponDetails.savings;

    const updatedCanUseDiscounts = calculateNewEligibility(
      vendor.couponDetails.canUseDiscounts,
      coupon.coupon_value
    );

    const couponUsage = {
      couponCode: coupon.coupon_code,
      discount: coupon.coupon_value,
      appliedAt: new Date(),
      originalAmount,
      discountAmount: couponDetails.savings,
      finalAmount: couponDetails.finalAmount
    };

    await Vendor.findOneAndUpdate(
      { id: vendorId },
      {
        $push: { 'couponDetails.appliedCoupons': couponUsage },
        $set: {
          'couponDetails.highestDiscountUsed': Math.max(vendor.couponDetails.highestDiscountUsed, coupon.coupon_value),
          'couponDetails.canUseDiscounts': updatedCanUseDiscounts
        }
      }
    );

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        couponDetails: {
          code: coupon.coupon_code,
          discount: coupon.coupon_value,
          family: coupon.coupon_family
        },
        paymentDetails: {
          originalAmount,
          discountAmount: couponDetails.savings,
          finalAmount: couponDetails.finalAmount,
          discountPercentage: coupon.coupon_value,
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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Vendor coupon history
export const getCouponHistory = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findOne({ id: vendorId }).select('couponDetails name');

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Validate coupon before applying
export const validateCoupon = async (req, res) => {
  try {
    const { vendorId, couponCode, originalAmount } = req.body;
    console.log(vendorId, couponCode, originalAmount);

    if (!vendorId || !couponCode || !originalAmount) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'vendorId, couponCode, and originalAmount are required'
      });
    }

    if (originalAmount <= 0) {
      return res.status(400).json({ success: false, valid: false, error: 'Original amount must be greater than 0' });
    }

    const vendor = await Vendor.findOne({ vendor_id: vendorId });

    const coupon = await Coupons.findOne({
      coupon_code: couponCode.toUpperCase(),
      is_active: true
    });

    if (!vendor) {
      return res.status(404).json({ success: false, valid: false, error: 'Vendor not found' });
    }

    if (!coupon) {
      return res.status(404).json({ success: false, valid: false, error: 'Invalid or inactive coupon code' });
    }

    const canUse = vendor.couponDetails.canUseDiscounts.includes(coupon.coupon_value);

    let pricingDetails = null;
    if (canUse) {
      const discountAmount = (originalAmount * coupon.coupon_value) / 100;
      const finalAmount = originalAmount - discountAmount;

      pricingDetails = {
        originalAmount,
        discountPercentage: coupon.coupon_value,
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
          code: coupon.coupon_code,
          discount: coupon.coupon_value,
          family: coupon.coupon_family
        } : null,
        pricing: pricingDetails,
        message: canUse
          ? `Valid! ${coupon.coupon_value}% discount from ${coupon.coupon_family} - Save ₹${pricingDetails.savings}`
          : `You cannot use ${coupon.coupon_value}% discount coupons. Available: ${vendor.couponDetails.canUseDiscounts.join(', ')}%`,
        vendorEligibility: {
          canUse: vendor.couponDetails.canUseDiscounts,
          highestUsed: vendor.couponDetails.highestDiscountUsed,
          reason: !canUse ? `You have already used a ${vendor.couponDetails.highestDiscountUsed}% discount coupon` : null
        }
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, valid: false, error: error.message });
  }
};

// Deactivate coupon (admin)
export const deactivateCoupon = async (req, res) => {
  try {
    const { couponCode } = req.params;

    const coupon = await Coupons.findOneAndUpdate(
      { coupon_code: couponCode.toUpperCase() },
      { is_active: false, coupon_updated_at: new Date() },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    res.json({
      success: true,
      message: `Coupon ${coupon.coupon_code} has been deactivated`,
      data: coupon
    });
  } catch (error) {
    console.error('Error deactivating coupon:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all coupons (admin)
export const getAllCoupons = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.is_active = isActive === 'true';
    }

    const coupons = await Coupons.find(filter).sort({ coupon_family: 1, coupon_value: -1 });

    res.json({
      success: true,
      data: {
        coupons,
        count: coupons.length
      }
    });
  } catch (error) {
    console.error('Error getting all coupons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
