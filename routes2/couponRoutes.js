import express from "express";
const router = express.Router();

import {
  getAvailableCoupons,
  applyCoupon,
  getCouponHistory,
  validateCoupon,
  deactivateCoupon,
  getAllCoupons,
  // createCoupon,
  // updateCoupon
} from "../controllers2/couponsController.js";

// ✅ Create a new coupon (Admin only)
// router.post("/", createCoupon);

// ✅ Update an existing coupon (Admin only)
// router.put("/:couponCode", updateCoupon);

// ✅ Get available coupons for a vendor
router.get("/available/:vendorId", getAvailableCoupons);

// ✅ Apply coupon during payment
router.post("/apply", applyCoupon);

// ✅ Get vendor's coupon usage history
router.get("/history/:vendorId", getCouponHistory);

// ✅ Validate coupon before applying
router.post("/validate", validateCoupon);

// ✅ Deactivate a coupon
router.patch("/deactivate/:couponCode", deactivateCoupon);

// ✅ Get all coupons (Admin)
router.get("/admin/all", getAllCoupons);

export default router;
