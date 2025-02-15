import { Router } from "express";
import { getFeaturedVendors } from "../controllers/featuredVendorsController.js";

const router = Router();

router.get("/featured-vendors", getFeaturedVendors);

export default router;
