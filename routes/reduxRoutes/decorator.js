// backend/routes/decorator.js
import express from "express";
const router = express.Router();
import { DecoratorModel } from "../../models/reduxStores/decorator.js";

/**
 * @swagger
 * tags:
 *   name: DecoratorDetails
 *   description: Manage decorator-related details
 */

/**
 * @swagger
 * /api/decorator-details:
 *   post:
 *     summary: Save or update decorator details
 *     tags: [DecoratorDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, decoratorData]
 *             properties:
 *               id:
 *                 type: string
 *               decoratorData:
 *                 type: object
 *                 additionalProperties: true
 *                 example:
 *                   companyName: "Elegant Weddings"
 *                   yearsInBusiness: 5
 *                   servicesOffered: ["Stage Decoration", "Lighting", "Floral Arrangements"]
 *     responses:
 *       201:
 *         description: Decorator details saved successfully
 *       200:
 *         description: Decorator details updated successfully
 *       400:
 *         description: Missing data
 *       500:
 *         description: Server error
 */
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
      return res.status(200).json({
        message: "Decorator details updated successfully.",
        data: updatedDetails,
      });
    } else {
      const newDecoratorDetails = new DecoratorModel({ id, ...decoratorData });
      await newDecoratorDetails.save();
      return res.status(201).json({
        message: "Decorator details saved successfully.",
        data: newDecoratorDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating decorator details:", error);
    res.status(500).json({
      message: "Failed to save or update decorator details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/decorator-details/{id}:
 *   get:
 *     summary: Get decorator details by user ID
 *     tags: [DecoratorDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Decorator details found
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/decorator-details/{id}:
 *   delete:
 *     summary: Delete decorator details by user ID
 *     tags: [DecoratorDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Decorator details deleted successfully
 *       404:
 *         description: Not found
 *       400:
 *         description: Missing user ID
 *       500:
 *         description: Server error
 */
// DELETE route to remove decorator details by user ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Deleting decorator details for ID:", id);

  if (!id) {
    return res
      .status(400)
      .json({ message: "User ID is required for deletion." });
  }

  try {
    // Use findOneAndDelete with a filter object
    const deletedDetails = await DecoratorModel.findOneAndDelete({ id });

    if (!deletedDetails) {
      return res
        .status(404)
        .json({ message: "Decorator details not found for deletion." });
    }

    console.log("✅ Deleted decorator details:", deletedDetails);
    res
      .status(200)
      .json({ message: "Decorator details deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting decorator details:", error);
    res.status(500).json({
      message: "Failed to delete decorator details.",
      error: error.message,
    });
  }
});

// Export the router
export { router as decoratorRoutes };
