// backend/routes/decorator.js
import express from "express";
const router = express.Router();
import { DecoratorModel } from "../../models/reduxStores/decorator.js";

// POST or PUT route to save or update decorator details
router.post("/", async (req, res) => {
  const { id, decoratorData } = req.body;

  // Validate id and decoratorData
  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!decoratorData || Object.keys(decoratorData).length === 0) {
    return res.status(400).json({ message: "Decorator details are required." });
  }

  try {
    const existingDetails = await DecoratorModel.findOne({ id });

    if (existingDetails) {
      const updatedDetails = await DecoratorModel.findOneAndUpdate(
        { id },
        { $set: decoratorData },
        { new: true, upsert: false },
      );
      return res
        .status(200)
        .json({
          message: "Decorator details updated successfully.",
          data: updatedDetails,
        });
    } else {
      const newDecoratorDetails = new DecoratorModel({ id, ...decoratorData });
      await newDecoratorDetails.save();
      return res
        .status(201)
        .json({
          message: "Decorator details saved successfully.",
          data: newDecoratorDetails,
        });
    }
  } catch (error) {
    console.error("Error saving/updating decorator details:", error);
    res
      .status(500)
      .json({
        message: "Failed to save or update decorator details.",
        error: error.message,
      });
  }
});

// GET route to retrieve decorator details by user ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const decoratorDetails = await DecoratorModel.findOne({ id });

    if (!decoratorDetails) {
      return res.status(404).json({ message: "Decorator details not found." });
    }

    res.status(200).json(decoratorDetails);
  } catch (error) {
    console.error("Error retrieving decorator details:", error);
    res.status(500).json({
      message: "Failed to retrieve decorator details.",
      error: error.message,
    });
  }
});

// Export the router
export { router as decoratorRoutes };
