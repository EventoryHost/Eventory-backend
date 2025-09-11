import { ReduxCatererModel } from "../models2/reduxModels/caterer.js";
import { ReduxDecoratorModel } from "../models2/reduxModels/decorator.js";
import { ReduxPhotographerVideographerModel } from "../models2/reduxModels/photographerVideographer.js";
import { ReduxVenueProviderModel } from "../models2/reduxModels/venueProvider.js"; // import PropRentalModel from "../models/reduxStores/prop-rental.js"; import { MakeupArtistModel } from "../models2/reduxModels/makeupArtist.js"; // import DjArtistModel from "../models/reduxStores/djArtist.js"; import mongoose from "mongoose";
import { MakeupArtistModel } from "../models2/reduxModels/makeupArtist.js";
// import PropRentalModel from "../models2/reduxModels/prop-rental.js";
// import DjArtistModel from "../models2/reduxModels/djArtist.js";

/**
 * Helper to select correct model based on flowType
 */
const getModelByFlowType = (flowType) => {
  switch (flowType) {
    case "caterer":
      return ReduxCatererModel;
    case "decorator":
      return ReduxDecoratorModel;
    case "photographerVideographer":
      return ReduxPhotographerVideographerModel;
    case "venue-provider":
      return ReduxVenueProviderModel;
    case "prop-rental":
      return PropRentalModel;
    case "makeupArtist":
      return MakeupArtistModel;
    case "djArtist":
    case "dj-artist": // alias
      return DjArtistModel;
    default:
      return null;
  }
};

/**
 * PUT controller → update vendor's page number
 */
export const updatePageNumber = async (req, res) => {
  const { flowType, vendor_id } = req.params;
  const { pageNumber } = req.body;

  console.log(
    "Received page number to update:",
    pageNumber,
    flowType,
    vendor_id
  );

  if (!pageNumber) {
    return res.status(400).json({ message: "Page number is required" });
  }

  try {
    const Model = getModelByFlowType(flowType);
    if (!Model) return res.status(400).json({ message: "Invalid flow type" });

    const updatedVendor = await Model.findOneAndUpdate(
      { vendor_id },
      { pageNumber },
      { new: true, upsert: true }
    );

    res.json({
      message: "Page number updated successfully",
      updatedPageNumber: updatedVendor.pageNumber,
    });
  } catch (error) {
    console.error("Error updating page number:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * GET controller → retrieve last saved page number
 */
export const getLastPageNumber = async (req, res) => {
  const { flowType, vendor_id } = req.params;

  try {
    const Model = getModelByFlowType(flowType);
    if (!Model) return res.status(400).json({ message: "Invalid flow type" });

    const vendor = await Model.findOne({ vendor_id });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json({
      lastPageNumber: vendor.pageNumber || 1,
    });
  } catch (error) {
    console.error("Error retrieving last page number:", error);
    res.status(500).json({ message: "Server error" });
  }
};
