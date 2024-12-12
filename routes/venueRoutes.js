import express from "express";
import { getVenueImages, getVenueVideos } from "../controllers/products/venueController.js";
const router = express.Router();

router.get("/venue", getVenueImages);

export default router;