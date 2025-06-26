import "dotenv/config";
import express from "express";
const verificationRoutes = express.Router();

import { verifyGSTIN, verifyPAN } from "../controllers/verificationController.js";

verificationRoutes.get("/GSTIN/:gstIn", verifyGSTIN);
verificationRoutes.get("/pan-gstin/:panNo", verifyPAN);

export default verificationRoutes;
