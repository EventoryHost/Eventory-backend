import express from "express";
import {
  authenticateEMAdmin,
  authenticateSalesAdmin,
  authenticateBusinessAdmin,
  getEMNotifications,
  markAllNotificationsAsRead,
  getEMProfile,
  updateEMProfile,
} from "../controllers/emadminController.js";
import {
  createVendorEnquiry,
  getAllVendorEnquiries,
  getVendorEnquiry,
  updateVendorEnquiry,
  deleteVendorEnquiry,
} from "../controllers/vendorEnquiryController.js";

const router = express.Router();
/**
 * @swagger
 * /api/EMauth:
 *   post:
 *     summary: Authenticate EM admin user
 *     tags:
 *       - EM Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       400:
 *         description: Missing username or password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// POST route for checking if a user exists
router.post("/emauth", authenticateEMAdmin);

/**
 * @swagger
 * /api/emadmin/salesauth:
 *   post:
 *     summary: Authenticate Sales Admin user
 *     tags:
 *       - EM Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       400:
 *         description: Missing username or password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/salesauth", authenticateSalesAdmin);

// POST route for Business Admin authentication
router.post("/businessauth", authenticateBusinessAdmin);

/**
 * @swagger
 * /api/{adminId}/emNotifications:
 *   get:
 *     summary: Get notifications for an admin
 *     tags:
 *       - EM Admin
 *     parameters:
 *       - in: path
 *         name: adminId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the admin
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       400:
 *         description: adminId is required
 *       500:
 *         description: Server error
 */

// GET route to fetch notifications by adminId
router.get("/:em_id/emNotifications", getEMNotifications);

/**
 * @swagger
 * /api/emNotifications/markAsRead:
 *   put:
 *     summary: Mark all unread notifications as read
 *     tags:
 *       - EM Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               em_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: em_id is required
 *       500:
 *         description: Server error
 */

// PUT /api/emNotifications/markAsRead
router.put("/emNotifications/markAsRead", markAllNotificationsAsRead);

/**
 * @swagger
 * /api/emProfile/{em_id}:
 *   get:
 *     summary: Get Event Manager Profile
 *     tags:
 *       - EM Admin
 *     parameters:
 *       - in: path
 *         name: em_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event Manager ID
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get("/em_profile/:em_id", getEMProfile);

/**
 * @swagger
 * /api/emProfile/{em_id}:
 *   put:
 *     summary: Update Event Manager Profile
 *     tags:
 *       - EM Admin
 *     parameters:
 *       - in: path
 *         name: em_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event Manager ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contact_name:
 *                 type: string
 *               contact_number:
 *                 type: string
 *               role:
 *                 type: string
 *               bio:
 *                 type: string
 *               profile_photo:
 *                 type: string
 *               yoe:
 *                 type: string
 *               experience:
 *                 type: string
 *               specialised_in:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Missing fields
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put("/em_profile/:em_id", updateEMProfile);

/**
 * @swagger
 * /api/emadmin/vendor-enquiries:
 *   post:
 *     summary: Create a new vendor enquiry and establish chat
 *     tags:
 *       - Vendor Enquiry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendor_id:
 *                 type: string
 *               vendor_name:
 *                 type: string
 *               vendor_email:
 *                 type: string
 *               vendor_mobile:
 *                 type: string
 *               vendor_type:
 *                 type: string
 *               service_id:
 *                 type: string
 *               em_id:
 *                 type: string
 *               em_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vendor enquiry created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/vendor-enquiries", createVendorEnquiry);

/**
 * @swagger
 * /api/emadmin/vendor-enquiries:
 *   get:
 *     summary: Get all vendor enquiries with pagination and filters
 *     tags:
 *       - Vendor Enquiry
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved, closed]
 *       - in: query
 *         name: em_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor enquiries fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/vendor-enquiries", getAllVendorEnquiries);

/**
 * @swagger
 * /api/emadmin/vendor-enquiries/{enquiry_id}:
 *   get:
 *     summary: Get a single vendor enquiry
 *     tags:
 *       - Vendor Enquiry
 *     parameters:
 *       - in: path
 *         name: enquiry_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor enquiry fetched successfully
 *       404:
 *         description: Vendor enquiry not found
 *       500:
 *         description: Server error
 */
router.get("/vendor-enquiries/:enquiry_id", getVendorEnquiry);

/**
 * @swagger
 * /api/emadmin/vendor-enquiries/{enquiry_id}:
 *   patch:
 *     summary: Update vendor enquiry status or notes
 *     tags:
 *       - Vendor Enquiry
 *     parameters:
 *       - in: path
 *         name: enquiry_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enquiry_status:
 *                 type: string
 *                 enum: [active, resolved, closed]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor enquiry updated successfully
 *       404:
 *         description: Vendor enquiry not found
 *       500:
 *         description: Server error
 */
router.patch("/vendor-enquiries/:enquiry_id", updateVendorEnquiry);

/**
 * @swagger
 * /api/emadmin/vendor-enquiries/{enquiry_id}:
 *   delete:
 *     summary: Delete a vendor enquiry
 *     tags:
 *       - Vendor Enquiry
 *     parameters:
 *       - in: path
 *         name: enquiry_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor enquiry deleted successfully
 *       404:
 *         description: Vendor enquiry not found
 *       500:
 *         description: Server error
 */
router.delete("/vendor-enquiries/:enquiry_id", deleteVendorEnquiry);

export default router;
