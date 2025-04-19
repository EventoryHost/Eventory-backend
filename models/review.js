import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const Schema = _Schema;

const reviewSchema = new Schema({
  reviewId: { type: String, default: () => generateUniqueId("rev"), required: true },
  serviceId: { type: String, required: true }, // Unique identifier for the service
  vendorType: { type: String, required: true }, // Vendor category (venue, caterer, etc.)
  userId: { type: String, required: true }, // User who submitted the review
  rating: { type: Number, required: true, min: 1, max: 5 }, // Rating (1-5)
  reviewerName: { type: String, required: true }, // User's name
  feedback: { type: String, required: true }, // Review content
  photos: { type: [String], default: [] }, // Optional photos
  date: { type: Date, default: Date.now }, // Auto-set date field
});

reviewSchema.index({ serviceId: 1, userId: 1 }, { unique: true });

const Review = model("Review", reviewSchema);
export { Review };
