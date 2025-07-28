import express from "express";
import { CateringModel } from "../models/reduxStores/catering.js";
import { DecoratorModel } from "../models/reduxStores/decorator.js";
import PAVModel from "../models/reduxStores/pav.js";
import VenueModel from "../models/reduxStores/venue-provider.js";
import PropRentalModel from "../models/reduxStores/prop-rental.js";
import MakeupArtistModel from "../models/reduxStores/makeUpArtist.js";
import DjArtistModel from "../models/reduxStores/djArtist.js";

const router = express.Router();

// Helper function to get the correct model based on flow type
const getModelByFlowType = (flowType) => {
  switch (flowType) {
    case "caterer":
      return CateringModel;
    case "decorator":
      return DecoratorModel;
    case "pav":
      return PAVModel;
    case "venue-provider":
      return VenueModel;
    case "prop-rental":
      return PropRentalModel;
    case "makeupArtist":
      return MakeupArtistModel;
    case "djArtist":
      return DjArtistModel;
    case "dj-artist":
      return DjArtistModel; 
    default:
      return null;
  }
};

// Route to update page number for a vendor
router.put("/:flowType/updatePageNumber/:id", async (req, res) => {
  const { flowType, id } = req.params;
  const { pageNumber } = req.body;
  console.log("recieved page number to update is " + pageNumber , flowType, id);

  if (!pageNumber) {
    return res.status(400).json({ message: "Page number is required" });
  }

  try {
    // Get the appropriate model based on flowType
    const Model = getModelByFlowType(flowType);

    if (!Model) {
      return res.status(400).json({ message: "Invalid flow type" });
    }

    // Update the page number in the vendor's record or create a new one if not found
    const updatedVendor = await Model.findOneAndUpdate(
      { id }, // Match vendor by ID (from URL params)
      { pageNumber }, // Set new page number
      { new: true, upsert: true }, // Upsert: create if not found
    );

    res.json({
      message: "Page number updated successfully",
      updatedPageNumber: updatedVendor.pageNumber,
    });
  } catch (error) {
    console.error("Error saving/updating catering details:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// New route to fetch the last visited page number for a vendor
router.get("/:flowType/getLastPageNumber/:vendorId", async (req, res) => {
  const { flowType, vendorId } = req.params;

  try {
    const Model = getModelByFlowType(flowType);

    if (!Model) {
      return res.status(400).json({ message: "Invalid flow type" });
    }

    // Fetch the vendor document by vendorId
    const vendor = await Model.findOne({ id: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Return the page number (last visited page)
    res.json({
      lastPageNumber: vendor.pageNumber || 1, // Return 1 if pageNumber is not set
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
