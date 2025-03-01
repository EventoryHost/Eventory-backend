import { Review } from "../models/review.js";
import { Venue } from "../models/venue.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";

// Mapping vendor types to their respective Mongoose models
const vendorModels = {
   venue: Venue,
   caterer: Caterer,
   // photographer: Photographer,
   decorator: Decorator,
};

// Function to update vendor's average rating
async function updateVendorRating(serviceId, vendorType) {
   const VendorModel = vendorModels[vendorType];
   if (!VendorModel) return;

   console.log(VendorModel);

   const result = await Review.aggregate([
      { $match: { serviceId } },
      { $group: { _id: "$serviceId", avgRating: { $avg: "$rating" } } },
   ]);

   console.log(result);
   
   const avgRating = result.length > 0 ? parseFloat(result[0].avgRating.toFixed(1)) : 0;
   await VendorModel.findOneAndUpdate({ id: serviceId }, { rating: avgRating });
}

// Create a new review
export const createReview = async (req, res) => {
   try {
      const { serviceId, vendorType, userId, rating, reviewerName, feedback, photos } = req.body;

      if (!vendorModels[vendorType]) {
         return res.status(400).json({ error: "Invalid vendor type." });
      }

      const newReview = await Review.create({
         serviceId,
         vendorType,
         userId,
         rating,
         reviewerName,
         feedback,
         photos,
      });

      await updateVendorRating(serviceId, vendorType);

      return res.status(201).json({ message: "Review created successfully", review: newReview });
   } catch (error) {
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
   }
};

// Get all reviews for a specific vendor
export const getReviewsByVendor = async (req, res) => {
   try {
      const { serviceId } = req.params;

      const reviews = await Review.find({ serviceId });
      return res.status(200).json({ reviews });
   } catch (error) {
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
   }
};

// Update a review
export const updateReview = async (req, res) => {
   try {
      const { reviewId } = req.params;
      const updatedReview = await Review.findByIdAndUpdate(reviewId, req.body, { new: true });

      if (!updatedReview) {
         return res.status(404).json({ error: "Review not found" });
      }

      await updateVendorRating(updatedReview.serviceId, updatedReview.vendorType);
      return res.status(200).json({ message: "Review updated successfully", review: updatedReview });
   } catch (error) {
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
   }
};

// Delete a review
export const deleteReview = async (req, res) => {
   try {
      const { reviewId } = req.params;
      const deletedReview = await Review.findByIdAndDelete(reviewId);

      if (!deletedReview) {
         return res.status(404).json({ error: "Review not found" });
      }

      await updateVendorRating(deletedReview.serviceId, deletedReview.vendorType);
      return res.status(200).json({ message: "Review deleted successfully" });
   } catch (error) {
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
   }
};