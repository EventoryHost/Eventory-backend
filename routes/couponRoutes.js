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

/**
 * @swagger
 * /api/coupons/available/{vendorId}:
 *   get:
 *     summary: Get available coupons for a vendor
 *     tags:
 *       - Coupons
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor's ID
 *     responses:
 *       200:
 *         description: List of available coupons
 *       500:
 *         description: Server error
 */

router.get('/available/:vendorId', getAvailableCoupons);

/**
 * @swagger
 * /api/coupons/apply:
 *   post:
 *     summary: Apply a coupon during payment
 *     tags:
 *       - Coupons
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode:
 *                 type: string
 *               vendorId:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Invalid coupon or request
 */


// Apply coupon during payment
router.post('/apply', applyCoupon);

/**
 * @swagger
 * /api/coupons/history/{vendorId}:
 *   get:
 *     summary: Get coupon usage history for a vendor
 *     tags:
 *       - Coupons
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon history returned
 *       500:
 *         description: Server error
 */

// Get vendor's coupon usage history
router.get('/history/:vendorId', getCouponHistory);

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate a coupon before applying
 *     tags:
 *       - Coupons
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode:
 *                 type: string
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Invalid or expired coupon
 */

// Validate coupon before applying
router.post('/validate', validateCoupon);

/**
 * @swagger
 * /api/coupons/deactivate/{couponCode}:
 *   patch:
 *     summary: Deactivate a coupon (admin only)
 *     tags:
 *       - Coupons
 *     parameters:
 *       - in: path
 *         name: couponCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deactivated
 *       404:
 *         description: Coupon not found
 */

// Admin routes
router.patch('/deactivate/:couponCode', deactivateCoupon);

/**
 * @swagger
 * /api/coupons/admin/all:
 *   get:
 *     summary: Get all coupons (admin only)
 *     tags:
 *       - Coupons
 *     responses:
 *       200:
 *         description: All coupons returned
 *       500:
 *         description: Server error
 */

router.get('/admin/all', getAllCoupons);

export default router;
