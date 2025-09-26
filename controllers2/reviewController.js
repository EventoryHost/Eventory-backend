import Reviews from "../models2/reviews.js";
import  VenueProvider  from "../models2/venueProvider.js";
import { Caterer } from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import Photographer from "../models2/photographerVideographer.js";
import MakeupArtist from "../models2/makeupArtist.js";

// Mapping vendor types to their respective Mongoose models
const vendorModels = {
  venue: VenueProvider,
  caterer: Caterer,
  photographer: Photographer,
  decorator: Decorator,
  makeupArtist: MakeupArtist,
};

// Function to update vendor's average rating
// async function updateVendorRating(service_id, service_type) {
//   const VendorModel = vendorModels[service_type];
//   if (!VendorModel) return;

//   console.log(VendorModel);

//   const result = await Reviews.aggregate([
//     { $match: { service_id } },
//     { $group: { _id: "$service_id", avgRating: { $avg: "$rating" } } },
//   ]);

//   console.log(result);

//   const avgRating =
//     result.length > 0 ? parseFloat(result[0].avgRating.toFixed(1)) : 0;

   
//   await VendorModel.findOneAndUpdate({ service_id }, { rating: avgRating });
// }

// Create a new review
export const createReview = async (req, res) => {
  try {
    const {
      service_id,
      customer_id,
      customer_name,
      service_type,
      rating,
      review,
      media_photo,
      media_video
    } = req.body;

    if (!vendorModels[service_type]) {
      return res.status(400).json({ error: "Invalid vendor type." });
    }

    const newReview = await Reviews.create({
      service_id,
      customer_id,
      customer_name,
      service_type,
      rating,
      review,
      media_photo,
      media_video
    });

    // await updateVendorRating(service_id, service_type);

    return res
      .status(201)
      .json({ message: "Review created successfully", review: newReview });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Get all reviews for a specific vendor
export const getReviewsByVendor = async (req, res) => {
  try {
    const { service_id, vendor_id } = req.query;

    console.log("Service ID:", service_id);
    console.log("Vendor ID:", vendor_id);

    if (!service_id || !vendor_id) {
      return res.status(400).json({ error: "Missing service_id or vendor_id" });
    }

    const reviews = await Reviews.find({ service_id, vendor_id });
    return res.status(200).json({ reviews });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReview = await Reviews.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // await updateVendorRating(updatedReview.service_id, updatedReview.service_type);
    return res
      .status(200)
      .json({ message: "Review updated successfully", review: updatedReview });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await Reviews.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // await updateVendorRating(deletedReview.service_id, deletedReview.service_type);
    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// export const getReviewCount = async (req, res) => {
//   try {
//     const { serviceId } = req.params;

//     if (!serviceId) {
//       return res.status(400).json({ error: "Missing serviceId parameter" });
//     }

//     const count = await Review.countDocuments({ serviceId });

//     return res.status(200).json({
//       serviceId,
//       count,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       error: "Internal Server Error",
//       details: error.message,
//     });
//   }
// };