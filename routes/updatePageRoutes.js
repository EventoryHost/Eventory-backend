import express from "express";
import  {ReduxCatererModel}  from "../models2/reduxModels/caterer.js";
import { ReduxDecoratorModel } from "../models2/reduxModels/decorator.js";
import {ReduxPhotographerVideographerModel} from "../models2/reduxModels/photographerVideographer.js";
import {ReduxVenueProviderModel} from "../models2/reduxModels/venueProvider.js";
// import PropRentalModel from "../models2/reduxModels/prop-rental.js";
import {MakeupArtistModel} from "../models2/reduxModels/makeupArtist.js";
// import DjArtistModel from "../models2/reduxModels/decorator.js";

const router = express.Router();

/**
 * Helper function to get the correct Mongoose model
 * based on the given `flowType` (vendor category).
 * 
 * @param {string} flowType - The type of vendor (e.g., 'caterer', 'decorator', 'djArtist').
 * @returns {Mongoose.Model|null} - The matching model or null if invalid flowType.
 */
const getModelByFlowType = (flowType) => {
  switch (flowType) {
    case "caterer":
      return ReduxCatererModel;
    case "decorator":
      return ReduxDecoratorModel;
    case "photographerVideographer":
      return ReduxPhotographerVideographerModel;
    case "venue_provider":
      return ReduxVenueProviderModel;
    case "prop_rental":
      return PropRentalModel;
    case "makeup_artist":
      return MakeupArtistModel;
    case "djArtist":
      return DjArtistModel;
    case "dj_artist":
      return DjArtistModel;
    default:
      return null;
  }
};

/**
 * PUT /:flowType/updatePageNumber/:id
 * 
 * Updates (or creates if not found) the `pageNumber` for a specific vendor.
 * This is useful for tracking the vendor's progress in multi-step forms or onboarding flows.
 * 
 * Path Params:
 * - flowType: Type of vendor (used to select correct model)
 * - id: Vendor's unique ID
 * 
 * Body:
 * - pageNumber: The new page number to save
 */
router.put("/:flowType/updatePageNumber/:vendor_id", async (req, res) => {
  const { flowType, vendor_id } = req.params;
  const { pageNumber } = req.body;

  console.log("Received page number to update:", pageNumber, flowType, vendor_id);

  // Validate input
  if (!pageNumber) {
    return res.status(400).json({ message: "Page number is required" });
  }

  try {
    // Select the correct model based on vendor type
    const Model = getModelByFlowType(flowType);

    if (!Model) {
      return res.status(400).json({ message: "Invalid flow type" });
    }

    // Find vendor by ID and update its pageNumber, or create if not found
    const updatedVendor = await Model.findOneAndUpdate(
      { vendor_id },
      { pageNumber },
      { new: true, upsert: false }
    );

    res.json({
      message: "Page number updated successfully",
      updatedPageNumber: updatedVendor.pageNumber,
    });
  } catch (error) {
    console.error("Error updating page number:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * GET /:flowType/getLastPageNumber/:vendorId
 * 
 * Retrieves the last saved `pageNumber` for a vendor.
 * This allows resuming the vendor onboarding or form flow from where they left off.
 * 
 * Path Params:
 * - flowType: Type of vendor
 * - vendorId: Vendor's unique ID
 */
router.get("/:flowType/getLastPageNumber/:vendor_id", async (req, res) => {
  const { flowType, vendor_id } = req.params;

  try {
    // Select correct model
    const Model = getModelByFlowType(flowType);

    if (!Model) {
      return res.status(400).json({ message: "Invalid flow type" });
    }

    // Fetch vendor data
    const vendor = await Model.findOne({ vendor_id: vendor_id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Return saved page number or default to 1 if not set
    res.json({
      lastPageNumber: vendor.pageNumber || 1,
    });
  } catch (error) {
    console.error("Error retrieving last page number:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
