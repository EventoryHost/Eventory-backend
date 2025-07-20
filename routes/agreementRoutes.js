import { Router } from "express";
import { generateAndStoreAgreement } from "../controllers/agreementController.js";

const router = Router();

// POST endpoint to generate and store agreement PDF
router.post("/generate/:serviceType/:vendorId", generateAndStoreAgreement);

export default router;
