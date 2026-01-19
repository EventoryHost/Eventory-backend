import express from "express";
import {
  setVendorPreference,
  removeVendorPreference,
  getVendorPreferences,
  checkVendorPreference,
  getLikedVendors,
} from "../controllers/vendorPreferenceController.js";

const router = express.Router();

// Set or update preference (like/reject)
router.post("/", setVendorPreference);

// Remove preference
router.delete("/", removeVendorPreference);

// Get all preferences for a customer
router.get("/", getVendorPreferences);

// Check specific vendor preference
router.get("/check", checkVendorPreference);

// Get liked vendors only
router.get("/liked", getLikedVendors);

export default router;
