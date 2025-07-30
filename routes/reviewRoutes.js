import express from "express";
import {
  createReview,
  getReviewsByVendor,
  updateReview,
  deleteReview,
  getReviewCount,
} from "../controllers/reviewController.js";

const reviewRoutes = express.Router();

reviewRoutes.post("/", createReview);

reviewRoutes.get("/", getReviewsByVendor);

reviewRoutes.put("/:reviewId", updateReview);

reviewRoutes.delete("/:reviewId", deleteReview);

reviewRoutes.get("/count/:serviceId", getReviewCount);

export default reviewRoutes;
