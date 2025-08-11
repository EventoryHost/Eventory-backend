import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// Reviews Schema according to ERD
const reviewsSchema = new Schema({
  feedback_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("FEED")
  },
  service_id: {
    type: String,
    required: true
  },
  customer_id: {
    type: String,
    required: true
  },
  customer_name: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    required: true,
    enum: ['Venue', 'Caterer', 'Decorator', 'Photographer', 'Makeup_Artist']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
    // Remove integer validation to allow decimals like 4.5
  },
  review: {
    type: String,
    required: true,
    maxlength: 1000
  },
  media_photo: {
    type: String,
    required: false
  },
  media_video: {
    type: String,
    required: false
  },
  feedback_submitted_at: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false, // Remove to avoid redundancy
  collection: 'reviews'
});


// Indexes for better performance
reviewsSchema.index({ service_id: 1, rating: -1 });
reviewsSchema.index({ feedback_submitted_at: -1 });
reviewsSchema.index({ customer_id: 1 });
reviewsSchema.index({ vendor_id: 1 });
reviewsSchema.index({ rating: -1 });

// Virtual for getting time ago
reviewsSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.feedback_submitted_at;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
});

// Instance methods
reviewsSchema.methods.hasMedia = function() {
  return !!(this.media_photo || this.media_video);
};

reviewsSchema.methods.getStarRating = function() {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
};

// Static methods
reviewsSchema.statics.getAverageRating = function(serviceId) {
  return this.aggregate([
    { $match: { service_id: serviceId } },
    { 
      $group: { 
        _id: null, 
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      } 
    }
  ]);
};

reviewsSchema.statics.getRatingDistribution = function(serviceId) {
  return this.aggregate([
    { $match: { service_id: serviceId } },
    { 
      $group: { 
        _id: '$rating', 
        count: { $sum: 1 }
      } 
    },
    { $sort: { _id: -1 } }
  ]);
};

reviewsSchema.statics.getRecentReviews = function(serviceId, limit = 10) {
  return this.find({ service_id: serviceId })
    .sort({ feedback_submitted_at: -1 })
    .limit(limit);
};

reviewsSchema.statics.getFeaturedReviews = function(serviceId, limit = 5) {
  return this.find({ 
    service_id: serviceId, 
    is_featured: true 
  })
    .sort({ feedback_submitted_at: -1 })
    .limit(limit);
};

reviewsSchema.statics.getTopRatedReviews = function(serviceId, minRating = 4, limit = 10) {
  return this.find({ 
    service_id: serviceId,
    rating: { $gte: minRating }
  })
    .sort({ rating: -1, feedback_submitted_at: -1 })
    .limit(limit);
};

// Pre-save middleware
reviewsSchema.pre('save', function(next) {
  // Ensure rating is within bounds
  if (this.rating < 1) this.rating = 1;
  if (this.rating > 5) this.rating = 5;
  next();
});

// Check if model already exists to prevent OverwriteModelError
const Reviews = mongoose.models.Reviews || mongoose.model('Reviews', reviewsSchema);

export default Reviews;
