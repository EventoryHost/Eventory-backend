import { Caterer } from "../../models/caterer.js";
import { Decorator } from "../../models/decoraters.js";
import { Venue } from "../../models/venue.js";
import propRental from "../../models/props.js";
import Photographer from "../../models/photographers.js";
import { Vendor } from "../../models/users.js";
import MakeupArtist from "../../models/makeupArtists.js";
import DjArtist from "../../models/djArtist.js";
import generateUniqueId from "../../utils/generateId.js";

const vendorModels = {
  caterer: Caterer,
  decorator: Decorator,
  "venue-provider": Venue,
  "prop-rental": propRental,
  pav: Photographer,
  venue: Venue,
  photographer: Photographer,
  propRental: propRental,
  makeupArtist: MakeupArtist,
  djArtist: DjArtist,
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
    const foundVendor = await VendorModel.findOne({ id: id });

    if (!foundVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(foundVendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVenue = async (req, res) => {
  try {
    const venue = await Venue.find();
    res.json(venue);
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to add bank details to a specific vendor
const getBankDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findOne({ id: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json(vendor.bankDetails); // Return all bank details
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res
      .status(500)
      .json({ message: "Error fetching bank details", error: error.message });
  }
};

const addBankDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { bankName, accountName, accountNo, ifscCode } = req.body;

    if (!bankName || !accountName || !accountNo || !ifscCode) {
      return res
        .status(400)
        .json({ message: "All bank details fields are required" });
    }

    const vendor = await Vendor.findOne({ id: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!vendor.bankDetails) {
      vendor.bankDetails = [];
    }

    const beneficiaryId = generateUniqueId("bene");

    const newBankDetails = { bankName, accountName, accountNo, ifscCode, beneficiaryId, };
    vendor.bankDetails.push(newBankDetails);


    await vendor.save();
    const updatedVendor = await Vendor.findOne({ id: vendorId });

    res.status(200).json({
      message: "Bank details added successfully",
      bankDetails: vendor.bankDetails,
    });
  } catch (error) {
    console.error("Error adding bank details:", error);
    res
      .status(500)
      .json({ message: "Error adding bank details", error: error.message });
  }
};

const deleteBankDetails = async (req, res) => {
  try {
    const { vendorId } = req.params; // Extract vendorId from the URL parameters

    // Find the vendor by vendorId
    const vendor = await Vendor.findOne({ id: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Remove bank details if they exist
    if (vendor.bankDetails) {
      vendor.bankDetails = null; // Remove bank details
      await vendor.save(); // Save the updated vendor document
      return res
        .status(200)
        .json({ message: "Bank details deleted successfully" });
    } else {
      return res.status(400).json({ message: "No bank details to delete" });
    }
  } catch (error) {
    console.error("Error deleting bank details:", error);
    res
      .status(500)
      .json({ message: "Error deleting bank details", error: error.message });
  }
};

export default {
  getVendorByIdAndCategory,
  addBankDetails,
  getBankDetails,
  deleteBankDetails,
};
