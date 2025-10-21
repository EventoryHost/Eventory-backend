import Reviews from "../models2/reviews.js";
import { PhotographerVideographer } from "../models2/photographerVideographer.js";
import VenueProvider from "../models2/venueProvider.js";
import Caterer from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import MakeupArtist from "../models2/makeupArtist.js";

const vendorModels = {
  venue_provider: VenueProvider,
  caterer: Caterer,
  photographer_videographer: PhotographerVideographer,
  decorator: Decorator,
  makeupartist: MakeupArtist,
};

const normalizeType = (t = "") => {
  t = String(t).trim().toLowerCase();
  if (["venue", "venue-provider", "venue provider", "venue_provider"].includes(t)) return "venue_provider";
  if (["pav", "photographer", "videographer", "photographer-videographer", "photographer_videographer"].includes(t))
    return "photographer_videographer";
  if (["makeup", "makeup-artist", "makeup artist", "makeup_artist", "makeupartist"].includes(t)) return "makeupartist";
  if (["caterer"].includes(t)) return "caterer";
  if (["decorator"].includes(t)) return "decorator";
  return t;
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
    // accept both frontend’s legacy keys and schema keys and map into Reviews schema fields
    const body = req.body || {};
    const service_id = body.service_id || body.serviceId || body.id;
    const customer_id = body.customer_id || body.userId || body.customerId;
    const customer_name = body.customer_name || body.reviewerName || body.customerName;
    const service_type = normalizeType(body.service_type || body.vendorType || body.type);
    const rating = typeof body.rating === "number" ? body.rating : parseFloat(body.rating);
    const review = body.review || body.feedback || "";
    const media_photo = body.media_photo || (Array.isArray(body.photos) ? body.photos[0] : body.photo) || "";
    const media_video = body.media_video || body.video || "";

    if (!service_id || !customer_id || !customer_name || !service_type || !rating) {
      return res.status(400).json({
        error: "Missing required fields",
        required: "service_id, customer_id, customer_name, service_type, rating",
      });
    }

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
      media_video,
    });

    return res.status(201).json({ message: "Review created successfully", review: newReview });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

export const getReviewsByVendor = async (req, res) => {
  try {
    const { service_id, vendor_id } = req.query;
    if (!service_id) {
      return res.status(400).json({ error: "Missing service_id" });
    }
    // Reviews schema has service_id; vendor_id is not stored there by default
    const reviews = await Reviews.find({ service_id }).sort({ feedback_submitted_at: -1 });
    return res.status(200).json({ reviews });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReview = await Reviews.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedReview) return res.status(404).json({ error: "Review not found" });
    return res.status(200).json({ message: "Review updated successfully", review: updatedReview });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await Reviews.findByIdAndDelete(id);
    if (!deletedReview) return res.status(404).json({ error: "Review not found" });
    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
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