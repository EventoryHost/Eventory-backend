import express from 'express';
const router = express.Router();
import { 
  getAvailableCoupons,
  applyCoupon,
  getCouponHistory,
  validateCoupon,
  deactivateCoupon,
  getAllCoupons
} from '../controllers/couponController.js';

router.get('/available/:vendorId', getAvailableCoupons);

// Apply coupon during payment
router.post('/apply', applyCoupon);

// Get vendor's coupon usage history
router.get('/history/:vendorId', getCouponHistory);

// Validate coupon before applying
router.post('/validate', validateCoupon);

// Admin routes
router.patch('/deactivate/:couponCode', deactivateCoupon);
router.get('/admin/all', getAllCoupons);

export default router;
