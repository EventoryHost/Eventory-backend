import { Vendor } from '../models2/vendor.js';
import { Customer } from '../models2/customer.js';
import Coupons from '../models2/coupons.js';
import { CustomerCoupon } from '../models2/customerCoupon.js';
// Helper: update eligibility after using a coupon
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

// Helper: eligibility message
const getEligibilityMessage = (eligibleDiscounts) => {
  if (!eligibleDiscounts || eligibleDiscounts.length === 0) {
    return 'You cannot use any more coupons in the future';
  }
  return `You can use ${eligibleDiscounts.join(', ')}% discount coupons in the future`;
};
// Helper: derive eligible discount percentages from vendor record
const deriveEligibleDiscounts = (highestDiscount) => {
  const highest = Number(highestDiscount) || 0;
  switch (highest) {
    case 100:
      return [];
    case 50:
      return [25];
    case 25:
      return [];
    default:
      // default starting set of allowed discounts (change if your business rule differs)
      return [25, 50, 100];
  }
};

const findCustomerRecord = (customerId) => {
  return Customer.findOne({ customer_id: customerId });
};

// 📌 Get available coupons (updated to use new Vendor schema fields)
export const getAvailableCoupons = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Ensure arrays exist to avoid crashes
    const usedCoupons = Array.isArray(vendor.coupons_used) ? vendor.coupons_used : [];
    const highestUsed = vendor.highest_discount_ever_applied || 0;

    // Determine what discount levels this vendor is allowed to use
    const eligibleDiscounts = deriveEligibleDiscounts(highestUsed);

    // Fetch all active coupons
    const allActiveCoupons = await Coupons.find({ is_active: true });

    // Filter: only those coupons whose coupon_value is in eligibleDiscounts
    // and that the vendor has not already used (coupon_code not present in coupons_used)
    const availableCoupons = allActiveCoupons.filter(coupon => {
      // Defensive checks in case fields are missing on coupon
      const value = typeof coupon.coupon_value === 'number' ? coupon.coupon_value : Number(coupon.coupon_value);
      const code = coupon.coupon_code ? String(coupon.coupon_code) : '';
      return eligibleDiscounts.includes(value) && !usedCoupons.includes(code);
    });

    return res.json({
      success: true,
      data: {
        availableCoupons,
        vendorEligibility: {
          canUse: eligibleDiscounts,
          highestUsed, // maps to vendor.highest_discount_ever_applied
          totalCouponsUsed: usedCoupons.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting available coupons:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 📌 Apply coupon
export const applyCoupon = async (req, res) => {
  try {
    const { vendor_id, coupon_code, couponDetails } = req.body;

    if (!vendor_id || !coupon_code || !couponDetails) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const coupon = await Coupons.findOne({
      coupon_code: coupon_code.toUpperCase(),
      is_active: true
    });
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid or inactive coupon code' });
    }

    // Prevent reusing the same coupon
    if (vendor.coupons_used.includes(coupon.coupon_code)) {
      return res.status(400).json({ success: false, error: 'Coupon already used' });
    }

    // Validate coupon value matches what frontend sent
    if (coupon.coupon_value !== couponDetails.discount) {
      return res.status(400).json({ success: false, error: 'Coupon details mismatch' });
    }

    const currentHighest = vendor.highest_discount_ever_applied || 0;
    const eligibleDiscounts = deriveEligibleDiscounts(currentHighest);

    // Check if vendor is eligible to use this discount
    if (!eligibleDiscounts.includes(coupon.coupon_value)) {
      return res.status(403).json({
        success: false,
        error: `You cannot use ${coupon.coupon_value}% discount coupons`,
        availableDiscounts: eligibleDiscounts
      });
    }

    const originalAmount = couponDetails.finalAmount + couponDetails.savings;

    // Update vendor record
    vendor.coupons_used.push(coupon.coupon_code);
    vendor.highest_discount_ever_applied = Math.max(currentHighest, coupon.coupon_value);
    vendor.last_coupon_used_at = new Date();
    await vendor.save();

    const newEligibility = deriveEligibleDiscounts(vendor.highest_discount_ever_applied);

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
          canUseDiscounts: newEligibility,
          totalCouponsUsed: vendor.coupons_used.length,
          highestDiscountEver: vendor.highest_discount_ever_applied
        }
      }
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📌 Get coupon history
export const getCouponHistory = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    // Find vendor by vendor_id
    const vendor = await Vendor.findOne({ vendor_id }).select('vendor_id vendor_mobile coupons_used highest_discount_ever_applied last_coupon_used_at');
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Fetch details of all coupons this vendor has used
    const usedCoupons = await Coupons.find({
      coupon_code: { $in: vendor.coupons_used }
    });

    // If you want total savings → requires summing coupon_value% of some originalAmount
    // Since schema does not persist savings, we can only show discount percentages
    // If needed, integrate with transactions/payments collection

    res.json({
      success: true,
      data: {
        vendorId: vendor.vendor_id,
        vendorMobile: vendor.vendor_mobile,
        couponHistory: usedCoupons.map(c => ({
          code: c.coupon_code,
          discount: c.coupon_value,
          family: c.coupon_family
        })),
        currentStatus: {
          highestDiscountUsed: vendor.highest_discount_ever_applied,
          totalCouponsUsed: vendor.coupons_used.length,
          lastCouponUsedAt: vendor.last_coupon_used_at,
          availableDiscounts: deriveEligibleDiscounts(vendor.highest_discount_ever_applied),
          eligibilityMessage: getEligibilityMessage(
            deriveEligibleDiscounts(vendor.highest_discount_ever_applied)
          )
        }
      }
    });
  } catch (error) {
    console.error('Error getting coupon history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// 📌 Validate coupon before applying
export const validateCoupon = async (req, res) => {
  try {
    const { vendor_id, coupon_code, originalAmount } = req.body; 

    if (!vendor_id || !coupon_code || !originalAmount) {
      return res.status(400).json({ success: false, valid: false, error: 'Missing fields' });
    }

    if (originalAmount <= 0) {
      return res.status(400).json({ success: false, valid: false, error: 'Amount must be > 0' });
    }

    // 🔹 Find vendor and coupon
    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      return res.status(404).json({ success: false, valid: false, error: 'Vendor not found' });
    }

    const coupon = await Coupons.findOne({
      coupon_code: coupon_code.toUpperCase(),
      is_active: true
    });
    if (!coupon) {
      return res.status(404).json({ success: false, valid: false, error: 'Invalid or inactive coupon code' });
    }

    // 🔹 Derive eligibility from vendor's record
    const eligibleDiscounts = deriveEligibleDiscounts(vendor.highest_discount_ever_applied);
    const alreadyUsed = vendor.coupons_used.includes(coupon.coupon_code);
    const canUse = eligibleDiscounts.includes(coupon.coupon_value) && !alreadyUsed;

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
        coupon: canUse
          ? {
              code: coupon.coupon_code,
              discount: coupon.coupon_value,
              family: coupon.coupon_family
            }
          : null,
        pricing: pricingDetails,
        message: canUse
          ? `✅ Valid! ${coupon.coupon_value}% discount from ${coupon.coupon_family} family - Save ₹${pricingDetails.savings}`
          : alreadyUsed
            ? `❌ You have already used coupon ${coupon.coupon_code}`
            : `❌ You cannot use ${coupon.coupon_value}% discount coupons. Available: ${eligibleDiscounts.join(', ')}%`,
        vendorEligibility: {
          canUse: eligibleDiscounts,
          highestUsed: vendor.highest_discount_ever_applied,
          totalCouponsUsed: vendor.coupons_used.length,
          reason: !canUse
            ? alreadyUsed
              ? `Coupon ${coupon.coupon_code} already used`
              : `You already used a ${vendor.highest_discount_ever_applied}% coupon`
            : null
        }
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, valid: false, error: error.message });
  }
};

// 📌 Deactivate coupon (admin)
export const deactivateCoupon = async (req, res) => {
  try {
    const { coupon_code } = req.params;

    if (!coupon_code) {
      return res.status(400).json({ success: false, error: "Coupon code is required" });
    }

    const coupon = await Coupons.findOneAndUpdate(
      { coupon_code: coupon_code.toUpperCase(), is_active: true }, // only if active
      { is_active: false, coupon_updated_at: new Date() },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, error: "Coupon not found or already inactive" });
    }

    res.json({
      success: true,
      message: `Coupon ${coupon.coupon_code} has been deactivated`,
      data: coupon
    });
  } catch (error) {
    console.error("Error deactivating coupon:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// 📌 Get all coupons
export const getAllCoupons = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.is_active = isActive === "true"; // string → boolean
    }

    const coupons = await Coupons.find(filter)
      .sort({ coupon_family: 1, coupon_value: -1 });

    res.json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    console.error("Error getting all coupons:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//to be done 
export const getAvailableCouponsForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await findCustomerRecord(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const usedCoupons = Array.isArray(customer.coupons_used) ? customer.coupons_used : [];
    const eligibleDiscounts = Array.isArray(customer.eligible_discounts) && customer.eligible_discounts.length
      ? customer.eligible_discounts
      : deriveEligibleDiscounts(customer.highest_discount_ever_applied);

    const allCoupons = await CustomerCoupon.find({ is_active: true });
    const availableCoupons = allCoupons.filter((c) =>
      eligibleDiscounts.includes(c.discount_percentage) && !usedCoupons.includes(c.coupon_code)
    );

    const mappedCoupons = availableCoupons.map((coupon) => ({
      code: coupon.coupon_code,
      team: coupon.coupon_team,
      discount: coupon.discount_percentage,
      isActive: coupon.is_active,
    }));

    return res.json({
      success: true,
      data: {
        availableCoupons: mappedCoupons,
        customerEligibility: {
          canUse: eligibleDiscounts,
          highestUsed: customer.highest_discount_ever_applied || 0,
          totalCouponsUsed: Array.isArray(customer.applied_coupons) ? customer.applied_coupons.length : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error getting available coupons (customer):', error);
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
        success: false,
        valid: false,
        error: 'customerId, couponCode, convenienceFee, and currentTotal are required',
      });
    }

    const customer = await findCustomerRecord(customerId);
    console.log("customer found:", customer);
    if (!customer) {
      return res.status(404).json({ success: false, valid: false, error: 'Customer not found' });
    }

    console.log(couponCode);
    const coupon = await CustomerCoupon.findOne({
      coupon_code: String(couponCode).toUpperCase(),
      is_active: true,
    });
    console.log("coupon found:", coupon);
    if (!coupon) {
      return res.status(404).json({ success: false, valid: false, error: 'Invalid or inactive coupon code' });
    }

    const eligibleDiscounts =
      (Array.isArray(customer.eligible_discounts) && customer.eligible_discounts.length
        ? customer.eligible_discounts
        : deriveEligibleDiscounts(customer.highest_discount_ever_applied)) || [];

    const canUse = eligibleDiscounts.includes(coupon.discount_percentage);

    let pricingDetails = null;
    if (canUse) {
      const fee = Math.max(0, Number(convenienceFee) || 0);
      const total = Math.max(0, Number(currentTotal) || 0);
      const rawDiscount = (fee * coupon.discount_percentage) / 100;
      const discountAmount = Math.min(rawDiscount, fee);
      const finalAmount = Math.max(0, total - discountAmount);

      pricingDetails = {
        originalAmount: total,
        discountPercentage: coupon.discount_percentage,
        discountAmount,
        finalAmount,
        savings: discountAmount,
      };
    }

    return res.json({
      success: true,
      valid: canUse,
      data: {
        coupon: canUse
          ? { code: coupon.coupon_code, discount: coupon.discount_percentage, team: coupon.coupon_team }
          : null,
        pricing: pricingDetails,
        message: canUse
          ? `Valid! ${coupon.discount_percentage}% off convenience fee - Save ₹${pricingDetails.savings}`
          : `You have already used a ${customer.highest_discount_ever_applied}% discount coupon`,
        customerEligibility: {
          canUse: eligibleDiscounts,
          highestUsed: customer.highest_discount_ever_applied || 0,
          reason: !canUse ? `You have already used a ${customer.highest_discount_ever_applied}% discount coupon` : null,
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
        error: 'Missing required fields: customerId, couponCode, couponDetails',
      });
    }
    const { finalAmount, savings, discount } = couponDetails || {};
    if (finalAmount == null || savings == null || discount == null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid couponDetails structure',
      });
    }

    const customer = await findCustomerRecord(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const coupon = await CustomerCoupon.findOne({
      coupon_code: String(couponCode).toUpperCase(),
      is_active: true,
    });
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid or inactive coupon code' });
    }

    if (coupon.discount_percentage !== Number(discount)) {
      return res.status(400).json({
        success: false,
        error: 'Coupon details mismatch. Please revalidate the coupon.',
      });
    }

    const currentEligible =
      Array.isArray(customer.eligible_discounts) && customer.eligible_discounts.length
        ? customer.eligible_discounts
        : deriveEligibleDiscounts(customer.highest_discount_ever_applied);

    if (!currentEligible.includes(coupon.discount_percentage)) {
      return res.status(403).json({
        success: false,
        error: `You cannot use ${coupon.discount_percentage}% discount coupons`,
        availableDiscounts: currentEligible,
      });
    }

    const originalAmount = Number(finalAmount) + Number(savings);

    const updatedCanUseDiscounts = calculateNewEligibility(
      currentEligible,
      coupon.discount_percentage,
    );

    const now = new Date();
    const couponUsage = {
      coupon_code: coupon.coupon_code,
      discount_percentage: coupon.discount_percentage,
      applied_at: now,
      original_amount: originalAmount,
      discount_amount: Number(savings),
      final_amount: Number(finalAmount),
    };

    await Customer.findOneAndUpdate(
      { $or: [{ customer_id: customerId }, { id: customerId }] },
      {
        $push: {
          applied_coupons: couponUsage,
          coupons_used: coupon.coupon_code,
        },
        $set: {
          highest_discount_ever_applied: Math.max(
            customer.highest_discount_ever_applied || 0,
            coupon.discount_percentage,
          ),
          eligible_discounts: updatedCanUseDiscounts,
          last_coupon_used_at: now,
        },
      },
    );

    return res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        couponDetails: {
          code: coupon.coupon_code,
          discount: coupon.discount_percentage,
          team: coupon.coupon_team,
        },
        paymentDetails: {
          originalAmount,
          discountAmount: Number(savings),
          finalAmount: Number(finalAmount),
          discountPercentage: coupon.discount_percentage,
          savings: Number(savings),
        },
        futureEligibility: {
          canUseDiscounts: updatedCanUseDiscounts,
          message: getEligibilityMessage(updatedCanUseDiscounts),
        },
      },
    });
  } catch (error) {
    console.error('Error applying coupon (customer):', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/coupons/customers/history/:customerId
export const getCustomerCouponHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({
      $or: [{ customer_id: customerId }, { id: customerId }],
    }).select(
      'customer_name applied_coupons highest_discount_ever_applied eligible_discounts',
    );
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const appliedCoupons = Array.isArray(customer.applied_coupons) ? customer.applied_coupons : [];
    const totalSavings = appliedCoupons.reduce((sum, c) => sum + (c.discount_amount || 0), 0);
    const eligibleDiscounts =
      Array.isArray(customer.eligible_discounts) && customer.eligible_discounts.length
        ? customer.eligible_discounts
        : deriveEligibleDiscounts(customer.highest_discount_ever_applied);

    const mappedHistory = appliedCoupons.map((usage) => ({
      couponCode: usage.coupon_code,
      discount: usage.discount_percentage,
      appliedAt: usage.applied_at,
      originalAmount: usage.original_amount,
      discountAmount: usage.discount_amount,
      finalAmount: usage.final_amount,
    }));

    return res.json({
      success: true,
      data: {
        customerName: customer.customer_name || 'Customer',
        couponHistory: mappedHistory,
        currentStatus: {
          highestDiscountUsed: customer.highest_discount_ever_applied || 0,
          canUseDiscounts: eligibleDiscounts,
          totalCouponsUsed: appliedCoupons.length,
          totalSavings,
          eligibilityMessage: getEligibilityMessage(eligibleDiscounts),
        },
      },
    });
  } catch (error) {
    console.error('Error getting coupon history (customer):', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};