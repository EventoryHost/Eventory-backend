import express from "express";
import {
  getAllVendors,
  getVendorById,
  getVendorNotifications,
  markAllNotificationsAsRead,
  patchMarkNotificationsAsRead,
  getVendorFlowType,
  checkVendorHasServices,
  getVendorCountsByCategory,
} from "../controllers/vendorController.js";

const router = express.Router();

// --- Vendor Routes ---
router.get("/all", getAllVendors);
router.get("/counts-by-category", getVendorCountsByCategory);
router.get("/:vendor_id", getVendorById);
router.get("/:vendor_id/flow-type", getVendorFlowType);
router.get("/:vendor_id/has-services", checkVendorHasServices);

// --- Vendor Notification Routes ---
router.get("/:vendor_id/vendorNotification", getVendorNotifications);
router.put(
  "/:vendor_id/vendorNotification/mark-read",
  markAllNotificationsAsRead,
);
router.patch(
  "/:vendor_id/vendorNotification/mark-as-read",
  patchMarkNotificationsAsRead,
);

export default router;
