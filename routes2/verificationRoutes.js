import "dotenv/config";
import express from "express";
const verificationRoutes = express.Router();

import { verifyGSTIN, verifyPAN, verifyBankDetails } from "../controllers2/verificationController.js";

verificationRoutes.get("/GSTIN/:gstIn", verifyGSTIN);
verificationRoutes.get("/pan-gstin/:panNo", verifyPAN);
verificationRoutes.post("/bank", verifyBankDetails);

export default verificationRoutes;