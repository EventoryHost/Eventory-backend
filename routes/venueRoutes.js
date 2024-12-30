import express from "express";
import {
  addReviews,
  getAllVenues,
  getVenueImages,
  getVenueReviews,
  getVenueVideos,
} from "../controllers/products/venueController.js";
const router = express.Router();

router.get("/venue", getVenueImages);
router.get("/allVenues", getAllVenues);
router.post("/review", addReviews);
router.get("/review", getVenueReviews);

export default router;
