import { ReduxCatererModel } from "../models/reduxModels/caterer.js";
import { ReduxDecoratorModel } from "../models/reduxModels/decorator.js";
import { ReduxPhotographerVideographerModel } from "../models/reduxModels/photographerVideographer.js";
import { ReduxVenueProviderModel } from "../models/reduxModels/venueProvider.js";
import { MakeupArtistModel } from "../models/reduxModels/makeupArtist.js";
import { DjArtistReduxModel } from "../models/reduxModels/djArtist.js";
import mongoose from "mongoose";

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
      return null; // Prop rental not implemented
    case "makeup_artist":
      return MakeupArtistModel;
    case "djArtist":
    case "dj-artist": // alias
      return DjArtistReduxModel;
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
