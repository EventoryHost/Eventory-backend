import { Caterer } from "../../models/caterer.js";
import { Decorator } from "../../models/decorator.js";
import VenueProvider from "../../models/venueProvider.js";
import Photographer from "../../models/photographerVideographer.js";
import { Vendor } from "../../models/vendor.js";
import MakeupArtist from "../../models/makeupArtist.js";
import DjArtist from "../../models/djArtist.js";
import axios from "axios";
import generateUniqueId from "../../utils/generateId.js";
import {
  buildPayoutsHeaders,
  getPayoutsBaseUrl,
  validateVPA,
} from "../../utils/cashfreePayoutsHelper.js";

// A mapping object to dynamically select the model based on the category
const vendorModels = {
  caterer: Caterer,
  decorator: Decorator,
  "venue-provider": VenueProvider,
  pav: Photographer,
  venue: VenueProvider,
  photographer: Photographer,
  makeupArtist: MakeupArtist,
  djArtist: DjArtist,
};

export const getServiceModel = (service_id) => {
  if (service_id.startsWith("VNP")) return VenueProvider;
  if (service_id.startsWith("CAT")) return Caterer;
  if (service_id.startsWith("DECO")) return Decorator;
  if (service_id.startsWith("MKA")) return MakeupArtist;
  if (service_id.startsWith("PAV")) return Photographer;
  if (service_id.startsWith("DJS")) return DjArtist;
  return null;
};

export const findService = async (vendor_id, service_id) => {
  const ServiceModel = getServiceModel(service_id);

  if (!ServiceModel) {
    throw new Error("Invalid service_id prefix");
  }

  const service = await ServiceModel.findOne({ vendor_id, service_id });

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
};

// Function to get a vendor by ID and category
export const getVendorByIdAndCategory = async (req, res) => {
  try {
    const { service_id, vendor_id } = req.params;

    // Validate input
    if (!service_id || !vendor_id) {
      return res
        .status(400)
        .json({ message: "service_id and vendor_id are required" });
    }

    // ✅ Get the correct Mongoose model based on prefix
    const ServiceModel = getServiceModel(service_id);
    if (!ServiceModel) {
      return res.status(400).json({ message: "Invalid service_id prefix" });
    }

    // ✅ Fetch vendor/service document
    const vendor = await ServiceModel.findOne({ service_id, vendor_id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      message: "Vendor fetched successfully",
      vendor,
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({
      message: "Error fetching vendor",
      error: error.message,
    });
  }
};

export const getVenue = async (req, res) => {
  try {
    const venue = await VenueProvider.find();
    res.json(venue);
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to add bank details to a specific vendor
const getBankDetails = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    if (!vendor_id) {
      return res.status(400).json({ message: "vendor_id is required" });
    }

    // ✅ Fetch all services of this vendor
    const [venue, caterer, decorator, makeupArtist, photographer, djArtist] =
      await Promise.all([
        VenueProvider.findOne(
          { vendor_id },
          { bank_details: 1, service_id: 1 },
        ),
        Caterer.findOne({ vendor_id }, { bank_details: 1, service_id: 1 }),
        Decorator.findOne({ vendor_id }, { bank_details: 1, service_id: 1 }),
        MakeupArtist.findOne({ vendor_id }, { bank_details: 1, service_id: 1 }),
        Photographer.findOne({ vendor_id }, { bank_details: 1, service_id: 1 }),
        DjArtist.findOne({ vendor_id }, { bank_details: 1, service_id: 1 }),
      ]);

    // ✅ Combine results (only include those that exist)
    const bankDetails = [];

    if (venue?.bank_details && Object.keys(venue.bank_details).length > 0) {
      bankDetails.push({
        service_type: "VenueProvider",
        service_id: venue.service_id,
        bank_details: venue.bank_details,
      });
    }

    if (caterer?.bank_details && Object.keys(caterer.bank_details).length > 0) {
      bankDetails.push({
        service_type: "Caterer",
        service_id: caterer.service_id,
        bank_details: caterer.bank_details,
      });
    }

    if (
      decorator?.bank_details &&
      Object.keys(decorator.bank_details).length > 0
    ) {
      bankDetails.push({
        service_type: "Decorator",
        service_id: decorator.service_id,
        bank_details: decorator.bank_details,
      });
    }

    if (
      makeupArtist?.bank_details &&
      Object.keys(makeupArtist.bank_details).length > 0
    ) {
      bankDetails.push({
        service_type: "MakeupArtist",
        service_id: makeupArtist.service_id,
        bank_details: makeupArtist.bank_details,
      });
    }

    if (
      photographer?.bank_details &&
      Object.keys(photographer.bank_details).length > 0
    ) {
      bankDetails.push({
        service_type: "PhotographerVideographer",
        service_id: photographer.service_id,
        bank_details: photographer.bank_details,
      });
    }

    if (
      djArtist?.bank_details &&
      Object.keys(djArtist.bank_details).length > 0
    ) {
      bankDetails.push({
        service_type: "DjArtist",
        service_id: djArtist.service_id,
        bank_details: djArtist.bank_details,
      });
    }

    // ✅ If no bank details found
    if (bankDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No bank details found for this vendor" });
    }

    // ✅ Success response
    res.status(200).json({
      vendor_id,
      total_services_with_bank_details: bankDetails.length,
      bankDetails,
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({
      message: "Error fetching bank details",
      error: error.message,
    });
  }
};

export const addBankDetails = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const {
      bank_name,
      account_number,
      account_type,
      ifsc,
      service_id,
      upi_id,
    } = req.body;

    if (!service_id || !vendor_id) {
      return res
        .status(400)
        .json({ message: "service_id and vendor_id are required" });
    }

    const hasBankDetails = !!(
      bank_name &&
      account_number &&
      account_type &&
      ifsc
    );
    const hasUpi = !!upi_id;

    if (!hasBankDetails && !hasUpi) {
      return res
        .status(400)
        .json({
          message:
            "Either bank details (bank name, account number, account type, IFSC) or UPI ID is required",
        });
    }

    // Heuristic VPA validation
    if (upi_id) {
      const vpaResult = validateVPA(upi_id);
      if (!vpaResult.valid) {
        return res.status(400).json({ message: vpaResult.error });
      }
    }

    const ServiceModel = getServiceModel(service_id);
    if (!ServiceModel) {
      return res.status(400).json({ message: "Invalid service_id prefix" });
    }

    // Check if there's an existing beneficiary_id
    const existingService = await ServiceModel.findOne({
      vendor_id,
      service_id,
    });
    let beneficiary_id = existingService?.bank_details?.beneficiary_id;

    if (!beneficiary_id) {
      beneficiary_id = generateUniqueId("BENE");
    }

    // Save bank details first
    const updateResult = await ServiceModel.updateOne(
      { vendor_id: vendor_id, service_id: service_id },
      {
        $set: {
          bank_details: {
            vendor_id,
            service_id,
            bank_name: bank_name || undefined,
            account_number: account_number || undefined,
            account_type: account_type || undefined,
            ifsc: ifsc || undefined,
            upi_id: upi_id || undefined,
            beneficiary_id,
          },
        },
      },
      { runValidators: true },
    );

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Service not found or no changes made" });
    }

    // Create/update Cashfree beneficiary
    try {
      const vendorDoc = await Vendor.findOne({ vendor_id });
      const vendorName =
        existingService?.business_details?.business_registration_name ||
        vendorDoc?.vendor_name ||
        "Vendor";

      const payoutsBase = getPayoutsBaseUrl();
      const headers = buildPayoutsHeaders();

      // Check if beneficiary already exists
      let hasBeneficiary = false;
      try {
        await axios.get(`${payoutsBase}/beneficiary`, {
          headers,
          params: { beneficiary_id },
        });
        hasBeneficiary = true;
      } catch (e) {
        if (e?.response?.status !== 404) {
          console.error(
            "❌ [addBankDetails] Error checking beneficiary:",
            e?.response?.data || e.message,
          );
        }
      }

      // Use bank details if available, otherwise VPA
      const instrumentDetails = hasBankDetails
        ? { bank_account_number: account_number, bank_ifsc: ifsc }
        : { vpa: upi_id };

      const beneficiaryBody = {
        beneficiary_id,
        beneficiary_name: vendorName,
        beneficiary_instrument_details: instrumentDetails,
        beneficiary_contact_details: {
          beneficiary_email: vendorDoc?.email || "noreply@example.com",
          beneficiary_phone: (vendorDoc?.vendor_mobile || "")
            .replace(/\D/g, "")
            .slice(-10),
          beneficiary_country_code: "+91",
        },
      };

      if (hasBeneficiary) {
        // Update existing beneficiary
        try {
          await axios.put(
            `${payoutsBase}/beneficiary/${beneficiary_id}`,
            beneficiaryBody,
            { headers },
          );
          console.log(
            `[addBankDetails] ✅ Beneficiary updated: ${beneficiary_id}`,
          );
        } catch (e) {
          console.error(
            "❌ [addBankDetails] Failed to update beneficiary:",
            e?.response?.data || e.message,
          );
        }
      } else {
        // Create new beneficiary
        try {
          await axios.post(`${payoutsBase}/beneficiary`, beneficiaryBody, {
            headers,
          });
          console.log(
            `[addBankDetails] ✅ Beneficiary created: ${beneficiary_id}`,
          );
        } catch (e) {
          console.error(
            "❌ [addBankDetails] Failed to create beneficiary:",
            e?.response?.data || e.message,
          );
        }
      }
    } catch (beneErr) {
      console.error(
        "❌ [addBankDetails] Beneficiary flow error:",
        beneErr.message,
      );
      // Don't fail the bank details save if beneficiary creation fails
    }

    res.status(200).json({
      message: "Bank details added/updated successfully",
    });
  } catch (error) {
    console.error("Error adding bank details:", error);
    res.status(500).json({
      message: error.message || "Error adding bank details",
    });
  }
};

export const deleteBankDetails = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { service_id } = req.body;

    if (!vendor_id || !service_id) {
      return res
        .status(400)
        .json({ message: "vendor_id and service_id are required" });
    }

    const ServiceModel = getServiceModel(service_id);
    if (!ServiceModel) {
      return res.status(400).json({ message: "Invalid service_id prefix" });
    }

    const updateResult = await ServiceModel.updateOne(
      { vendor_id: vendor_id, service_id: service_id },
      { $unset: { bank_details: "" } },
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Service not found or no bank details to delete" });
    }

    res.status(200).json({
      message: "Bank details deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bank details:", error);
    res.status(500).json({
      message: error.message || "Error deleting bank details",
    });
  }
};
export default {
  getVendorByIdAndCategory,
  addBankDetails,
  getBankDetails,
  deleteBankDetails,
};
