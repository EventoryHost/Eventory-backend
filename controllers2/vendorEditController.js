import { Vendor } from "../models2/vendor.js";
import { Caterer } from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import Photographer from "../models2/photographerVideographer.js";
import PropRental from "../models/props.js";
import VenueProvider from "../models2/venueProvider.js";
import MakeupArtist from "../models2/makeupArtist.js";
import DjArtist from "../models/djArtist.js";

// 1. Update vendor-level fields + service_types
export const updateVendorAndService = async (req, res) => {
  const { serviceId } = req.params;
  const updateData = req.body;

  console.log(
    `API received update for serviceId=${serviceId}, payload=${JSON.stringify(
      updateData
    )}`
  );

  try {
    const vendor = await Vendor.findOne({ services: serviceId });
    if (!vendor) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Vendor-level fields
    if (updateData.vendor_mobile)
      vendor.vendor_mobile = updateData.vendor_mobile;
    if (updateData.email_address)
      vendor.email_address = updateData.email_address;
    if (updateData.profile_picture)
      vendor.profile_picture = updateData.profile_picture;

    if (updateData.highest_discount_ever_applied !== undefined) {
      vendor.highest_discount_ever_applied =
        updateData.highest_discount_ever_applied;
    }

    if (updateData.coupons_used && Array.isArray(updateData.coupons_used)) {
      vendor.coupons_used = updateData.coupons_used;
      vendor.last_coupon_used_at = new Date();
    }

    if (updateData.service_types && Array.isArray(updateData.service_types)) {
      vendor.service_types = updateData.service_types;
    } else {
      vendor.service_types = vendor.service_types.map((service) => {
        if (service.service_id === serviceId) {
          return {
            ...service,
            service_name: updateData.service_name || service.service_name,
            service_status: updateData.service_status || service.service_status,
          };
        }
        return service;
      });
    }

    console.log("Final service_types:", vendor.service_types);
    await vendor.save();

    res.status(200).json({
      message: "Service and vendor updated successfully",
      vendor,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// 2. Update service details (description + company name)
export const updateDetails = async (req, res) => {
  const { serviceId } = req.params;
  const { newDescription, newCompanyName } = req.body;

  try {
    const vendor = await Vendor.findOne({ services: serviceId });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const service = vendor.services.find((s) => s === serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const modelMap = {
      CAT: Caterer,
      DEC: Decorator,
      PAV: Photographer,
      VEN: VenueProvider,
      PRO: PropRental,
      MAK: MakeupArtist,
      DJA: DjArtist,
    };

    const prefix = service.substring(0, 3);
    const Model = modelMap[prefix];
    if (!Model) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    const serviceDoc = await Model.findOne({
      service_id: service,
      vendor_id: vendor.vendor_id,
    });

    if (!serviceDoc) {
      return res
        .status(404)
        .json({ message: `${serviceId} service not found` });
    }

    const updateFields = {
      "basic_details.description": newDescription,
      "business_details.business_registration_name": newCompanyName,
    };

    const updatedServiceDoc = await serviceDoc.constructor.findOneAndUpdate(
      { _id: serviceDoc._id },
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    return res.status(200).json({
      message: "Service updated successfully",
      data: updatedServiceDoc,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
