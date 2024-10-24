import { Caterer } from "../../models/caterer.js";
import { Decorator } from "../../models/decoraters.js";
import { Venue } from "../../models/venue.js";
import propRental from "../../models/props.js";
import Photographer from "../../models/photographers.js";

// A mapping object to dynamically select the model based on the category
const vendorModels = {
  caterer: Caterer,
  decorator: Decorator,
  "venue-provider": Venue,
  propRental: propRental,
  pav: Photographer,
};

// Function to get a vendor by ID and category
const getVendorByIdAndCategory = async (req, res) => {
  try {
    const { vendor, id } = req.params; // Extract vendor (category) and id from request params

    // Check if the passed vendor category exists in the vendorModels map
    const VendorModel = vendorModels[vendor];

    if (!VendorModel) {
      return res.status(400).json({ message: "Invalid vendor category" });
    }

    // Find vendor by both ID and category model
    const foundVendor = await VendorModel.findOne({ venId: id });

    if (!foundVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(foundVendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  getVendorByIdAndCategory,
};
