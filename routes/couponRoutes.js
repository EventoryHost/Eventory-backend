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
  validateCouponForCustomer,
  getAllCustomerCouponsAdmin,
  createCustomerCouponAdmin,
  updateCustomerCouponAdmin,
  toggleCustomerCouponActiveAdmin,
  migrateCustomerCouponsTypeAdmin,
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

// Customer Coupons
router.get("/customers/available/:customerId", getAvailableCouponsForCustomer);
router.post("/customers/apply", applyCouponForCustomer);
router.get("/customers/history/:customerId", getCustomerCouponHistory);
router.post("/customers/validate", validateCouponForCustomer);

// Customer Coupons Admin Management
router.get("/customers/admin/all", getAllCustomerCouponsAdmin);
router.post("/customers/admin/create", createCustomerCouponAdmin);
router.patch("/customers/admin/update/:coupon_code", updateCustomerCouponAdmin);
router.patch("/customers/admin/toggle-active/:coupon_code", toggleCustomerCouponActiveAdmin);
router.post("/customers/admin/migrate-types", migrateCustomerCouponsTypeAdmin);

export default router;
