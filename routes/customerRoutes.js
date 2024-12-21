import express from "express";
import { addCustomer, getCustomer } from "../controllers/customerController.js";
const router = express.Router();

router.post("/add-customer", addCustomer);
router.get("/get-customer", getCustomer);

export default router;