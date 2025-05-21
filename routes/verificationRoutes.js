import "dotenv/config";
import express from "express";
const verificationRoutes = express.Router();

import { verifyGSTIN } from "../controllers/verificationController.js";

verificationRoutes.get("/GSTIN/:GSTIN", verifyGSTIN);

export default verificationRoutes;
