import express from "express";
import {
  getAllVendors,
  getVendorById,
  getVendorNotifications,
  markAllNotificationsAsRead,
  patchMarkNotificationsAsRead,
  getVendorFlowType,
} from "../controllers2/vendorController.js";

const router = express.Router();

// --- Vendor Routes ---
router.get("/all", getAllVendors);
router.get("/:vendor_id", getVendorById);
router.get("/:vendor_id/flow-type", getVendorFlowType); 

// --- Vendor Notification Routes ---
router.get("/:vendor_id/vendorNotification", getVendorNotifications);
router.put("/:vendor_id/vendorNotification/mark-read", markAllNotificationsAsRead);
router.patch("/:vendor_id/vendorNotification/mark-as-read", patchMarkNotificationsAsRead);

export default router;
