import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const Schema = mongoose.Schema;

// Reviews Schema according to ERD
const reviewsSchema = new Schema(
  {
    feedback_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateUniqueId("FEED"),
    },
    service_id: {
      type: String,
      required: true,
    },
    customer_id: {
      type: String,
      required: true,
    },
    customer_name: {
      type: String,
      required: true,
    },
    service_type: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 1000,
    },
    media_photo: {
      type: String,
    },
    media_video: {
      type: String,
    },
    feedback_submitted_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "reviews",
  },
);

// Indexes for better performance
reviewsSchema.index({ service_id: 1, rating: -1 });
reviewsSchema.index({ feedback_submitted_at: -1 });
reviewsSchema.index({ customer_id: 1 });
reviewsSchema.index({ rating: -1 });

// Pre-save middleware
reviewsSchema.pre("save", function (next) {
  // Ensure rating is within bounds
  if (this.rating < 1) this.rating = 1;
  if (this.rating > 5) this.rating = 5;
  next();
});

// Check if model already exists to prevent OverwriteModelError
const Reviews =
  mongoose.models.Reviews || mongoose.model("Reviews", reviewsSchema);

export default Reviews;
