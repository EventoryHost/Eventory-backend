import express from "express";
import { ReduxPhotographerVideographerModel } from "../../models/reduxModels/photographerVideographer.js";

const router = express.Router();

/** photographer DETAILS ROUTES **/

// POST or PUT route to save or update photographer details
// Route: /photographer-details/
router.post("/", async (req, res) => {
  const { vendor_id, pavData } = req.body;
  if (!vendor_id) {
    return res.status(400).json({ message: "Vendor ID is required." });
  }

  if (!pavData || Object.keys(pavData).length === 0) {
    return res
      .status(400)
      .json({ message: "photographer details are required." });
  }

  try {
    const dataToSave = {
      vendor_id,
      ...pavData,
    };

    const updatedDetails =
      await ReduxPhotographerVideographerModel.findOneAndUpdate(
        { vendor_id },
        dataToSave,
        { new: true, upsert: true },
      );

    const message = updatedDetails.isNew
      ? "photographer details saved successfully."
      : "photographer details updated successfully.";

    return res.status(200).json({
      message,
      data: updatedDetails,
    });
  } catch (error) {
    console.error("Error saving/updating photographer details:", error);
    res.status(500).json({
      message: "Failed to save or update photographer details.",
      error: error.message,
    });
  }
});

// GET route to retrieve photographer details by vendor ID
// Route: /photographer-details/:vendor_id
router.get("/:vendor_id", async (req, res) => {
  const { vendor_id } = req.params;

  try {
    const pavDetails = await ReduxPhotographerVideographerModel.findOne({
      vendor_id: vendor_id.trim(),
    });

    if (!pavDetails) {
      return res
        .status(404)
        .json({ message: "photographer details not found." });
    }

    res.status(200).json(pavDetails);
  } catch (error) {
    console.error("Error retrieving photographer details:", error);
    res.status(500).json({
      message: "Failed to retrieve photographer details.",
      error: error.message,
    });
  }
});

// DELETE route to remove photographer details by vendor ID
// Route: /photographer-details/:vendor_id
router.delete("/:vendor_id", async (req, res) => {
  const { vendor_id } = req.params;

  if (!vendor_id || vendor_id.trim() === "") {
    return res
      .status(400)
      .json({ message: "Vendor ID is required for deletion." });
  }

  try {
    const deletedDetails =
      await ReduxPhotographerVideographerModel.findOneAndDelete({
        vendor_id: vendor_id,
      });

    if (!deletedDetails) {
      return res
        .status(404)
        .json({ message: "photographer details not found for deletion." });
    }

    res
      .status(200)
      .json({ message: "photographer details deleted successfully." });
  } catch (error) {
    console.error("Error deleting photographer details:", error);
    res.status(500).json({
      message: "Failed to delete photographer details.",
      error: error.message,
    });
  }
});

// Export the router so it can be used in other files
export default router;
