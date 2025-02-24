import express from "express";
const router = express.Router();
import MakeupArtistModel from "../../models/reduxStores/makeUpArtist.js";

// POST or PUT route to save or update makeup artist details
router.post("/", async (req, res) => {
  const { id, data } = req.body;

  // Validate id and data
  if (!id) {
    console.log("Error: User ID is required.");
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!data || Object.keys(data).length === 0) {
    console.log("Error: Makeup artist details are required.");
    return res
      .status(400)
      .json({ message: "Makeup artist details are required." });
  }

  try {
    console.log("Finding existing makeup artist details for id:", id);
    const existingDetails = await MakeupArtistModel.findOne({ id });

    if (existingDetails) {
      console.log("Found existing details for id:", id);
      console.log("Updating makeup artist details:", data);
      const updatedDetails = await MakeupArtistModel.findOneAndUpdate(
        { id },
        { $set: data },
        { new: true, upsert: false },
      );
      console.log("Updated details:", updatedDetails);
      return res.status(200).json({
        message: "Makeup artist details updated successfully.",
        data: updatedDetails,
      });
    } else {
      console.log(
        "No existing details found. Creating new makeup artist details.",
      );
      const newMakeupArtistDetails = new MakeupArtistModel({
        id,
        ...data,
      });
      await newMakeupArtistDetails.save();
      console.log("New details saved:", newMakeupArtistDetails);
      return res.status(201).json({
        message: "Makeup artist details saved successfully.",
        data: newMakeupArtistDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating makeup artist details:", error);
    res.status(500).json({
      message: "Failed to save or update makeup artist details.",
      error: error.message,
    });
  }
});

// GET route to retrieve makeup artist details by user ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Retrieving makeup artist details for id:", id);

  try {
    console.log("Finding makeup artist details for id:", id);
    const makeupArtistDetails = await MakeupArtistModel.findOne({ id });

    if (!makeupArtistDetails) {
      console.log("No makeup artist details found for id:", id);
      return res
        .status(404)
        .json({ message: "Makeup artist details not found." });
    }

    console.log("Found makeup artist details:", makeupArtistDetails);
    res.status(200).json(makeupArtistDetails);
  } catch (error) {
    console.error("Error retrieving makeup artist details:", error);
    res.status(500).json({
      message: "Failed to retrieve makeup artist details.",
      error: error.message,
    });
  }
});

// Export the router
export { router as makeupArtistRoutes };
