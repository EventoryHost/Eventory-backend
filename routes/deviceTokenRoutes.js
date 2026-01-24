import { Router } from "express";
const deviceTokenRoutes = Router();
import deviceTokenController from "../controllers/deviceTokenController.js";

// Store device token for a vendor
deviceTokenRoutes.post("/store", deviceTokenController.storeDeviceToken);

// Remove device token (for logout from specific device)
deviceTokenRoutes.delete("/remove", deviceTokenController.removeDeviceToken);

// Get all device tokens for a vendor
deviceTokenRoutes.get("/:vendorId", deviceTokenController.getDeviceTokens);

// Remove all device tokens for a vendor (logout from all devices)
deviceTokenRoutes.delete("/remove-all", deviceTokenController.removeAllDeviceTokens);

export default deviceTokenRoutes;
