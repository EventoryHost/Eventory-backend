import express from "express";
const router = express.Router();

import {
  getAvailableCoupons,
  applyCoupon,
  getCouponHistory,
  validateCoupon,
  deactivateCoupon,
  getAllCoupons,
  getAvailableCouponsForCustomer,
  applyCouponForCustomer,
  getCustomerCouponHistory,
  validateCouponForCustomer
} from "../controllers/couponsController.js";

// ✅ Get available coupons for a vendor
router.get("/available/:vendor_id", getAvailableCoupons);

// ✅ Apply coupon during payment
router.post("/apply", applyCoupon);

// ✅ Get vendor's coupon usage history
router.get("/history/:vendor_id", getCouponHistory);

// ✅ Validate coupon before applying
router.post("/validate", validateCoupon);

// ✅ Deactivate a coupon
router.patch("/deactivate/:coupon_code", deactivateCoupon);

// ✅ Get all coupons (Admin)
router.get("/admin/all", getAllCoupons);


//to be done

router.get('/customers/available/:customerId', getAvailableCouponsForCustomer);
router.post('/customers/apply', applyCouponForCustomer);
router.get('/customers/history/:customerId', getCustomerCouponHistory);
router.post('/customers/validate', validateCouponForCustomer);

export default router;
