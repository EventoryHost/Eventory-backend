import express from "express";
import {
   createReview,
   getReviewsByVendor,
   updateReview,
   deleteReview,
} from "../controllers/reviewController.js";

const reviewRoutes = express.Router();

reviewRoutes.post("/", createReview);

reviewRoutes.get("/:serviceId", getReviewsByVendor);

reviewRoutes.put("/:reviewId", updateReview);

reviewRoutes.delete("/:reviewId", deleteReview);

export default reviewRoutes;