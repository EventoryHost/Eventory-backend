import { Router } from "express";
import { generateAndStoreAgreement, addVendorAgreement } from "../controllers2/agreementController.js";

const router = Router();

router.post("/generate/:serviceType/:vendorId", generateAndStoreAgreement);

router.post("/add-vendor-agreement", addVendorAgreement);

export default router;
