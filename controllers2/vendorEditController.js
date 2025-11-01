import mongoose from "mongoose";
import { Vendor } from "../models2/vendor.js";
import { Caterer } from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import { Invoices } from "../models2/invoices.js";
import Photographer from "../models2/photographerVideographer.js";
import PropRental from "../models/props.js";
import VenueProvider from "../models2/venueProvider.js";
import MakeupArtist from "../models2/makeupArtist.js";
import DjArtist from "../models2/djArtist.js";
import { checkDecoratorProfileCompletion } from "../utils/completionUtils/decoratorCompletionUtils.js";
import { checkCatererProfileCompletion } from "../utils/completionUtils/catererCompletionUtils.js";
import { checkPhotographerProfileCompletion } from "../utils/completionUtils/pavCompletionUtils.js";
import { checkVenueProfileCompletion } from "../utils/completionUtils/venueCompletionUtils.js";
import { checkMakeupArtistProfileCompletion } from "../utils/completionUtils/makeupCompletionUtils.js";
import { checkDjArtistProfileCompletion } from "../utils/completionUtils/djCompletionUtils.js";

import { Calendar } from "../models2/calendar.js";
import Chat2 from "../models2/chats.js";
import { Events } from "../models2/events.js";
import Orders from "../models2/orders.js";
import Quotations from "../models2/quotations.js";
import Reviews from "../models2/reviews.js";
import VendorNotifications from "../models2/vendorNotifications.js";
import { Customer } from "../models2/customer.js";

import { getServiceModel } from "../utils/serviceMapper.js";

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
      VNP: VenueProvider,
      PRO: PropRental,
      MAK: MakeupArtist,
      MKA: MakeupArtist,
      DJA: DjArtist,
      DJS: DjArtist,  // DJ Artist service ID prefix
    };

    // Try 4-character prefix first, then fallback to 3-character
    let prefix = service.substring(0, 4).toUpperCase();
    let Model = modelMap[prefix];
    
    if (!Model) {
      // Fallback to 3-character prefix
      prefix = service.substring(0, 3).toUpperCase();
      Model = modelMap[prefix];
    }
    
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

// 3. API endpoint to update service details

export const updateServiceDetails = async (req, res) => {
  const { serId } = req.params;
  const updateData = req.body;

  console.log(
    `3..API  Data recieved from the frontend is ${JSON.stringify(updateData)}`
  );

  try {
    const vendor = await Vendor.findOne({ services: serId });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Vendor-level fields
    let vendorUpdated = false;
    if (updateData.vendor_mobile) {
      vendor.vendor_mobile = updateData.vendor_mobile;
      vendorUpdated = true;
    }
    if (updateData.email_address) {
      vendor.email_address = updateData.email_address;
      vendorUpdated = true;
    }
    if (updateData.profile_picture) {
      vendor.profile_picture = updateData.profile_picture;
      vendorUpdated = true;
    }
    if (vendorUpdated) {
      await vendor.save();
      console.log("Vendor-level fields updated successfully");
    }

    // New schema: services and service_types are parallel arrays
    // IMPORTANT: Always find by service_id match, not by index, since arrays can be misaligned
    let serviceObj = vendor.service_types?.find(
      (st) => st?.service_id === serId
    );
    
    // If not found by service_id, try index-based lookup as fallback
    if (!serviceObj) {
      const serviceIndex = vendor.services.indexOf(serId);
      if (serviceIndex !== -1 && vendor.service_types?.[serviceIndex]) {
        serviceObj = vendor.service_types[serviceIndex];
        // Validate that service_id matches
        if (serviceObj.service_id !== serId) {
          console.warn(`Service ID mismatch at index ${serviceIndex}! Expected: ${serId}, Found: ${serviceObj.service_id}`);
          // Service IDs don't match, so we'll use prefix-based detection instead
          serviceObj = null;
        }
      }
    }
    
    // If still not found, detect from service ID prefix
    if (!serviceObj) {
      const prefix = serId.substring(0, 3).toUpperCase();
      console.log(`Service not found in service_types, detecting from prefix: ${prefix}`);
      
      if (prefix === 'DJS' || prefix === 'DJA') {
        console.log(`Detecting DJ Artist from prefix ${prefix}`);
        // Directly update DJ Artist without relying on service_types
        try {
          const updatedService = await DjArtist.findOneAndUpdate(
            { service_id: serId },
            { $set: updateData },
            { new: true, runValidators: false }
          );
          if (updatedService) {
            await checkDjArtistProfileCompletion(serId);
            const isVerified = checkVerification(updatedService, 'dj-artist');
            await updatedService.updateOne({ is_active: isVerified });
            const profileCompletion = calculateProfileCompletion(updatedService, 'dj-artist');
            await updatedService.updateOne({ profile_completion_score: profileCompletion });
            return res.status(200).json({ 
              message: "Details updated successfully (prefix-based detection)", 
              updatedService 
            });
          } else {
            return res.status(404).json({ error: "DJ Artist service not found" });
          }
        } catch (updateError) {
          console.error(`Error updating DJ Artist:`, updateError);
          return res.status(500).json({ 
            error: "Failed to update DJ Artist",
            details: updateError.message 
          });
        }
      }
      
      return res.status(404).json({ 
        error: "Service not found in vendor's service_types",
        serviceId: serId,
        suggestion: "Service may not be linked to this vendor properly"
      });
    }
    
    // Found service object - proceed with update
    console.log(`Found service:`, serviceObj);
    const serType = serviceObj.service_name;
    console.log(`Service type from DB: ${serType}, Service ID: ${serId}`);
    
    // Validate that service_id matches (extra safety check)
    if (serviceObj.service_id !== serId) {
      console.warn(`Service ID mismatch! Expected: ${serId}, Found: ${serviceObj.service_id}`);
      // Use prefix-based detection instead
      const prefix = serId.substring(0, 3).toUpperCase();
      if (prefix === 'DJS' || prefix === 'DJA') {
        console.log(`Service ID mismatch, but detecting DJ Artist from prefix ${prefix}`);
        const updatedService = await DjArtist.findOneAndUpdate(
          { service_id: serId },
          { $set: updateData },
          { new: true, runValidators: false }
        );
        if (updatedService) {
          await checkDjArtistProfileCompletion(serId);
          const isVerified = checkVerification(updatedService, 'dj-artist');
          await updatedService.updateOne({ is_active: isVerified });
          const profileCompletion = calculateProfileCompletion(updatedService, 'dj-artist');
          await updatedService.updateOne({ profile_completion_score: profileCompletion });
          return res.status(200).json({ 
            message: "Details updated successfully (prefix-based detection due to mismatch)", 
            updatedService 
          });
        }
      }
      return res.status(404).json({ 
        error: "Service ID mismatch",
        expected: serId,
        found: serviceObj.service_id
      });
    }
    
    // Normalize service type: handle variations and extract prefix as fallback
    let normalizedServiceType = serType?.toLowerCase().trim();
    
    // If service_type is not found or unclear, detect from service_id prefix as fallback
    if (!normalizedServiceType || normalizedServiceType === "unknown") {
      const prefix = serId.substring(0, 3).toUpperCase();
      const prefixMap = {
        'CAT': 'caterer',
        'DEC': 'decorator',
        'PAV': 'photographer-videographer',
        'VNP': 'venue-provider',
        'VEN': 'venue-provider',
        'MKA': 'makeup-artist',
        'MAK': 'makeup-artist',
        'DJS': 'dj-artist',
        'DJA': 'dj-artist',
      };
      normalizedServiceType = prefixMap[prefix] || normalizedServiceType;
      console.log(`Service type detected from prefix ${prefix}: ${normalizedServiceType}`);
    }
    
    // Handle DJ-Artist variations (with hyphen, space, capitals, etc.)
    // Normalize all DJ variations to 'dj-artist' for consistent matching
    if (normalizedServiceType && (
      normalizedServiceType === 'dj-artist' ||
      normalizedServiceType === 'dj artist' ||
      normalizedServiceType === 'djartist' ||
      normalizedServiceType === 'dj' ||
      (normalizedServiceType.includes('dj') && normalizedServiceType.includes('artist'))
    )) {
      // Normalize all DJ variations to 'dj-artist'
      normalizedServiceType = 'dj-artist';
      console.log(`DJ Artist detected, normalized to: ${normalizedServiceType}`);
    }
    
    console.log(`Normalized service type: ${normalizedServiceType}`);
    let updatedService;

    // Step 2: Update the respective service based on service type
    switch (normalizedServiceType) {
      case "caterer":
        updatedService = await Caterer.findOneAndUpdate(
          { service_id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkCatererProfileCompletion(serId);
        break;
      case "decorator":
        updatedService = await Decorator.findOneAndUpdate(
          { service_id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkDecoratorProfileCompletion(serId);
        break;
      case "pav":
      case "photographer-videographer":
      case "photographer videographer":
        updatedService = await Photographer.findOneAndUpdate(
          { service_id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkPhotographerProfileCompletion(serId);
        break;
      case "venue-provider":
        updatedService = await VenueProvider.findOneAndUpdate(
          { service_id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkVenueProfileCompletion(serId);
        break;
      case "prop-rental":
        updatedService = await PropRental.findOneAndUpdate(
          { service_id: serId },
          { $set: updateData },
          { new: true }
        );
        break;
      case "makeup-artist":
      case "makeupArtist":
        updatedService = await MakeupArtist.findOneAndUpdate(
          { service_id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkMakeupArtistProfileCompletion(serId);
        break;
      case "dj-artist":
      case "djartist":
      case "djArtist":
      case "dj":
      case "dj artist": // Handle space-separated variation
        console.log(`Updating DJ Artist with service_id: ${serId}`);
        console.log(`Update data received: ${JSON.stringify(updateData, null, 2)}`);
        try {
          updatedService = await DjArtist.findOneAndUpdate(
            { service_id: serId },
            { $set: updateData },
            { new: true, runValidators: false }
          );
          if (!updatedService) {
            console.error(`DJ Artist not found with service_id: ${serId}`);
            return res.status(404).json({ error: "DJ Artist service not found" });
          }
          console.log(`DJ Artist updated successfully. Updated service:`, updatedService);
          await checkDjArtistProfileCompletion(serId);
        } catch (updateError) {
          console.error(`Error updating DJ Artist:`, updateError);
          return res.status(500).json({ 
            error: "Failed to update DJ Artist",
            details: updateError.message 
          });
        }
        break;
      default:
        console.log("ERROR: Fell through to default case!");
        console.log("Service type received:", serType);
        console.log("Service type lowercase:", serType?.toLowerCase());
        console.log("Normalized service type:", normalizedServiceType);
        // Fallback: try to detect from service ID prefix
        const fallbackPrefix = serId.substring(0, 3).toUpperCase();
        if (fallbackPrefix === 'DJS' || fallbackPrefix === 'DJA') {
          console.log(`Fallback: Detected DJ Artist from prefix ${fallbackPrefix}`);
          updatedService = await DjArtist.findOneAndUpdate(
            { service_id: serId },
            { $set: updateData },
            { new: true }
          );
          if (updatedService) {
            await checkDjArtistProfileCompletion(serId);
            console.log(`DJ Artist updated successfully via fallback`);
            break;
          }
        }
        return res.status(400).json({
          error: "Unsupported service type",
          received: serType,
          receivedLowercase: serType?.toLowerCase(),
          normalized: normalizedServiceType,
          serviceId: serId,
        });
    }

    if (!updatedService) {
      return res.status(404).json({ error: "Service not found for update" });
    }

    // Use normalized service type for verification and completion calculation
    const serviceTypeForChecks = normalizedServiceType || serType?.toLowerCase() || 'dj-artist';
    const isVerified = checkVerification(updatedService, serviceTypeForChecks);
    console.log(`Verification status for ${serviceTypeForChecks}: ${isVerified}`);
    await updatedService.updateOne({ is_active: isVerified });

    // Step 3: Calculate and update profile completion percentage
    const profileCompletion = calculateProfileCompletion(
      updatedService,
      serviceTypeForChecks
    );

    await updatedService.updateOne({
      profile_completion_score: profileCompletion,
    });

    return res
      .status(200)
      .json({ message: "Details updated successfully", updatedService });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//helper variables and functions
export const serviceFields = {
  caterer: [
    // "business_details.business_name",
    // "business_details.manager_name",
    "basic_details.min_booking_capacity",
    "basic_details.description",
    "basic_details.cuisine_specialities",
    "basic_details.regional_specialities",
    "basic_details.service_style_offered",
    "event_details.menu",
    "event_details.veg_or_nonveg",
    "event_details.pre_set_menus",
    "event_details.menu_customizable",
    "event_details.event_types_catered",
    "event_details.additional_services_for_any_event",
    "event_details.staff_provided",
    "additional_details.max_booking_period",
    "additional_details.min_booking_period",
    "additional_details.asset_images",
    "additional_details.asset_videos",
    "additional_details.is_tasting_session_provided",
    "additional_details.is_business_license_available",
    "additional_details.food_safety_certificates",
    "additional_details.prices_starts_from",
    "policies.cancellation_policy",
    "policies.terms_and_conditions",
  ],
  decorator: [
    // "business_details.business_name",
    "basic_details.avg_setup_duration",
    "basic_details.description",
    "basic_details.event_types_decorated",
    "theme_details.themes_offered",
    "theme_details.is_colour_scheme_assistance_provided",
    "theme_details.is_venue_adaptability",
    "theme_details.is_theme_customization_allowed",
    "theme_details.theme_elements_available",
    "theme_details.theme_portfolio_images",
    "theme_details.theme_portfolio_videos",
    "additional_details.prices_starts_from",
    "additional_details.min_booking_period",
    "additional_details.is_theme_proposals_provided",
    "additional_details.is_proposal_revision_possible",
    "policies.cancellation_policy",
    "policies.terms_and_conditions",
  ],
  djArtist: [
    "basic_details.point_of_contact",
    "basic_details.service_contact_number",
    "basic_details.description",
    "basic_details.service_areas",
    "basic_details.service_location_dj_artist.service_address",
    "service_details.event_types_dj",
    "service_details.music_genres",
    "service_details.regional_specializations",
    "service_details.services_offered",
    "additional_details.asset_images",
    "additional_details.asset_videos",
    "additional_details.ig_socials_link",
    "additional_details.web_social_link",
    "additional_details.prices_starts_from",
    "policies.terms_and_conditions",
    "policies.cancellation_policy",
  ],
  "dj-artist": [
    "basic_details.point_of_contact",
    "basic_details.service_contact_number",
    "basic_details.description",
    "basic_details.service_areas",
    "basic_details.service_location_dj_artist.service_address",
    "service_details.event_types_dj",
    "service_details.music_genres",
    "service_details.regional_specializations",
    "service_details.services_offered",
    "additional_details.asset_images",
    "additional_details.asset_videos",
    "additional_details.ig_socials_link",
    "additional_details.web_social_link",
    "additional_details.prices_starts_from",
    "policies.terms_and_conditions",
    "policies.cancellation_policy",
  ],
  makeupArtist: [
    // "business_details.business_name",
    "basic_details.min_booking_capacity",
    "basic_details.max_booking_capacity",
    "basic_details.description",
    "basic_details.event_types_makeup",
    "basic_details.types_of_makeup_artists_available",
    "service_details.is_onsite_makeup_available",
    "service_details.is_customization_possible",
    "service_details.service_types",
    "additional_details.asset_images",
    "policies.terms_and_conditions",
    "policies.cancellation_policy",
  ],
  "makeup-artist": [
    // "business_details.business_name",
    "basic_details.min_booking_capacity",
    "basic_details.max_booking_capacity",
    "basic_details.description",
    "basic_details.event_types_makeup",
    "basic_details.types_of_makeup_artists_available",
    "service_details.is_onsite_makeup_available",
    "service_details.is_customization_possible",
    "service_details.service_types",
    "additional_details.asset_images",
    "policies.terms_and_conditions",
    "policies.cancellation_policy",
  ],

  pav: [
    // "business_details.business_name",
    "basic_details.min_booking_capacity",
    "basic_details.max_booking_capacity",
    "basic_details.description",
    "basic_details.event_types_captured",
    "additional_details.prices_starts_from",
    "service_details.types_of_styles_offered",
    "service_details.types_of_equipment_available",
    "service_details.add_ons_upgrade_available",
    "service_details.final_delivery_methods",
    "service_details.types_of_styles_offered",
    "service_details.types_of_equipment_available",
    "service_details.add_ons_upgrade_available",
    "service_details.final_delivery_methods",
    "basic_details.do_initial_customer_consultation",
    "basic_details.send_proposals_to_clients",
    "basic_details.do_post_production_services",
    "basic_details.do_destination_events",
    "basic_details.do_advance_setup",
    "policies.terms_and_conditions",
    "policies.cancellation_policy",
    "additional_details.asset_images",
    "additional_details.asset_videos",
  ],

  "venue-provider": [
    "basic_details.venue_name",
    "basic_details.min_booking_capacity",
    "basic_details.max_booking_capacity",
    "additional_details.prices_starts_from",
    "feature_details.venue_types_available",
    "feature_details.accessibility_features_of_venue",
    "feature_details.restriction_policies_on_venue",
    "feature_details.fascilities_at_venue",
    "feature_details.in_house_catering",
    "feature_details.in_house_decoration",
    "additional_details.min_booking_period",
    "policies.terms_and_conditions",
    "policies.cancellation_policy",
    "additional_details.asset_images",
    "additional_details.asset_videos",
  ],
};

// Add aliases for service types
serviceFields["photographer-videographer"] = serviceFields.pav;
serviceFields["photographer videographer"] = serviceFields.pav;
serviceFields["dj-artist"] = serviceFields.djArtist;
serviceFields["djartist"] = serviceFields.djArtist;
serviceFields["dj"] = serviceFields.djArtist;

export const calculateProfileCompletion = (serviceData, serviceType) => {
  console.log(`Calculating profile completion for ${serviceType} service...`);
  const requiredFields = serviceFields[serviceType.toLowerCase()];
  if (!requiredFields) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  let filledFields = 0;

  requiredFields.forEach((field) => {
    const fieldPath = field.split("."); // Split by '.' to handle nested fields
    let currentValue = serviceData;

    // Traverse through the field path
    for (let key of fieldPath) {
      if (currentValue[key] !== undefined && currentValue[key] !== null) {
        currentValue = currentValue[key];
      } else {
        console.log(`Field ${field} ❌`);
        return; // Field is not filled, exit early
      }
    }

    // Check if the final value is filled (non-empty string or non-null)
    if (currentValue?.toString().trim()) {
      filledFields += 1;
      console.log(`Field ${field} ✅`);
    } else {
      console.log(`Field ${field} ❌`);
    }
  });

  const completionPercentage = (filledFields / requiredFields.length) * 100;
  console.log(`Profile completion: ${completionPercentage}%`);
  return Math.round(completionPercentage);
};

// Helper function to check verification criteria (Checkers)
const checkVerification = (service, serType) => {
  console.log(`Checking verification for ${serType} service...`);
  let allFieldsValid = true;

  let fieldsToCheck = [];

  switch (serType.toLowerCase()) {
    case "caterer":
      fieldsToCheck = [
        // basic_details fields
        { path: "basic_details.point_of_contact", label: "Point of Contact" },
        {
          path: "basic_details.min_booking_capacity",
          label: "Minimum Booking Capacity",
        },
        {
          path: "basic_details.max_booking_capacity",
          label: "Maximum Booking Capacity",
        },
        { path: "basic_details.description", label: "Description" },
        {
          path: "basic_details.cuisine_specialities",
          label: "Cuisine Specialities",
        },
        {
          path: "basic_details.regional_specialities",
          label: "Regional Specialities",
        },
        {
          path: "basic_details.service_style_offered",
          label: "Service Style Offered",
        },

        // event_details fields
        { path: "event_details.menu", label: "Menu" },
        {
          path: "event_details.veg_or_nonveg",
          label: "Vegetarian or Non-Vegetarian",
        },
        { path: "event_details.pre_set_menus", label: "Pre-set Menus" },
        { path: "event_details.menu_customizable", label: "Customizable Menu" },
        {
          path: "event_details.event_types_catered",
          label: "Event Types Catered",
        },
        {
          path: "event_details.additional_services_for_any_event",
          label: "Additional Services",
        },
        { path: "event_details.staff_provided", label: "Staff Provided" },

        // additional_details fields
        {
          path: "additional_details.min_booking_period",
          label: "Minimum Booking Period",
        },
        { path: "additional_details.asset_images", label: "Asset Images" },
        { path: "additional_details.asset_videos", label: "Asset Videos" },
        {
          path: "additional_details.is_tasting_session_provided",
          label: "Tasting Session Provided",
        },
        {
          path: "additional_details.is_business_license_available",
          label: "Business License Available",
        },
        {
          path: "additional_details.food_safety_certificates",
          label: "Food Safety Certificates",
        },
        {
          path: "additional_details.prices_starts_from",
          label: "Price Starting From",
        },

        // policies fields
        { path: "policies.cancellation_policy", label: "Cancellation Policy" },
        { path: "policies.terms_and_conditions", label: "Terms & Conditions" },
      ];
      break;
    case "decorator":
      fieldsToCheck = [
        // business_details field
        // { path: "business_details.business_name", label: "Service Name" },

        // basic_details fields
        {
          path: "basic_details.avg_setup_duration",
          label: "Average Setup Duration",
        },
        { path: "basic_details.description", label: "Description" },
        {
          path: "basic_details.event_types_decorated",
          label: "Event Types Decorated",
        },

        // theme_details fields
        { path: "theme_details.themes_offered", label: "Themes Offered" },
        {
          path: "theme_details.is_colour_scheme_assistance_provided",
          label: "Color Scheme Assistance",
        },
        {
          path: "theme_details.is_venue_adaptability",
          label: "Venue Adaptability",
        },
        {
          path: "theme_details.is_theme_customization_allowed",
          label: "Theme Customization",
        },
        {
          path: "theme_details.theme_elements_available",
          label: "Theme Elements",
        },
        { path: "theme_details.theme_portfolio_images", label: "Theme Photos" },
        { path: "theme_details.theme_portfolio_videos", label: "Theme Videos" },

        {
          path: "additional_details.prices_starts_from",
          label: "Price Starting From",
        },
        {
          path: "additional_details.min_booking_period",
          label: "Advance Booking Period",
        },
        {
          path: "additional_details.is_theme_proposals_provided",
          label: "Theme Proposals",
        },
        {
          path: "additional_details.is_proposal_revision_possible",
          label: "Proposal Revisions",
        },
        { path: "additional_details.asset_images", label: "Additional Photos" },

        // policies fields
        { path: "policies.terms_and_conditions", label: "Terms & Conditions" },
        { path: "policies.cancellation_policy", label: "Cancellation Policy" },
      ];
      break;
    case "pav":
    case "photographer-videographer":
    case "photographer videographer":
      fieldsToCheck = [
        // business_details field
        // { path: "business_details.business_name", label: "Business Name" },
        // { path: "business_details.manager_name", label: "Manager Name" },

        // basic_details fields
        {
          path: "basic_details.min_booking_capacity",
          label: "Minimum Booking Capacity",
        },
        {
          path: "basic_details.max_booking_capacity",
          label: "Maximum Booking Capacity",
        },
        { path: "basic_details.description", label: "Description" },
        { path: "basic_details.event_types_captured", label: "Event Types" },
        {
          path: "basic_details.do_initial_customer_consultation",
          label: "Initial Customer Consultation",
        },
        {
          path: "basic_details.send_proposals_to_clients",
          label: "Proposals to Clients",
        },
        {
          path: "basic_details.do_post_production_services",
          label: "Post-production Services",
        },
        {
          path: "basic_details.do_destination_events",
          label: "Destination Events",
        },
        { path: "basic_details.do_advance_setup", label: "Advance Setup" },

        // service_details fields
        {
          path: "service_details.types_of_styles_offered",
          label: "Photography/Videography Styles",
        },
        {
          path: "service_details.types_of_equipment_available",
          label: "Equipment Available",
        },
        {
          path: "service_details.add_ons_upgrade_available",
          label: "Add-ons or Upgrades",
        },
        {
          path: "service_details.final_delivery_methods",
          label: "Final Delivery Methods",
        },

        // additional_details fields
        {
          path: "additional_details.prices_starts_from",
          label: "Price Starting From",
        },
        { path: "additional_details.asset_images", label: "Photos" },
        { path: "additional_details.asset_videos", label: "Videos" },
        {
          path: "additional_details.min_booking_period",
          label: "Minimum Booking Period",
        },

        // policies fields
        { path: "policies.cancellation_policy", label: "Cancellation Policy" },
        { path: "policies.terms_and_conditions", label: "Terms & Conditions" },
      ];
      break;
    case "venue-provider":
      fieldsToCheck = [
        // business_details fields
        // { path: "business_details.business_name", label: "Business Name" },
        // { path: "business_details.manager_name", label: "Manager Name" },

        {
          path: "basic_details.min_booking_capacity",
          label: "Minimum Booking Capacity",
        },
        {
          path: "basic_details.max_booking_capacity",
          label: "Maximum Booking Capacity",
        },
        {
          path: "additional_details.prices_starts_from",
          label: "Price Starting From",
        },
        { path: "feature_details.venue_types_available", label: "Venue Types" },
        {
          path: "feature_details.accessibility_features_of_venue",
          label: "Accessibility Features",
        },
        {
          path: "feature_details.restriction_policies_on_venue",
          label: "Restrictions and Policies",
        },
        { path: "feature_details.fascilities_at_venue", label: "Facilities" },
        {
          path: "feature_details.in_house_catering",
          label: "Catering Services Available",
        },
        {
          path: "feature_details.in_house_decoration",
          label: "In-House Decoration",
        },
        { path: "additional_details.asset_images", label: "Photos" },
        { path: "additional_details.asset_videos", label: "Videos" },
        // policies fields
        { path: "policies.cancellation_policy", label: "Cancellation Policy" },
        { path: "policies.terms_and_conditions", label: "Terms & Conditions" },
      ];
    case "makeup-artist":
      fieldsToCheck = [
        // business_details field
        // { path: "business_details.business_name", label: "Service Name" },

        // basic_details fields
        {
          path: "basic_details.min_booking_capacity",
          label: "Minimum Booking Capacity",
        },
        {
          path: "basic_details.max_booking_capacity",
          label: "Maximum Booking Capacity",
        },
        { path: "basic_details.description", label: "Description" },
        {
          path: "basic_details.event_types_makeup",
          label: "Event Types Makeup",
        },
        {
          path: "basic_details.types_of_makeup_artists_available",
          label: "Types of Makeup Artists",
        },
        {
          path: "service_details.is_onsite_makeup_available",
          label: "Onsite Makeup Available",
        },
        {
          path: "service_details.is_customization_possible",
          label: "Customization",
        },
        {
          path: "service_details.service_types",
          label: "Service Types",
        },

        // additional_details fields
        {
          path: "additional_details.asset_images",
          label: "Additional Photos",
        },
        {
          path: "additional_details.asset_videos",
          label: "Additional Videos",
        },
        {
          path: "additional_details.min_booking_period",
          label: "Advance Booking Period",
        },
        {
          path: "additional_details.max_booking_period",
          label: "Advance Booking Period",
        },
        {
          path: "additional_details.prices_starts_from",
          label: "Price Starting From",
        },
        {
          path: "additional_details.ig_socials_link",
          label: "Instagram Socials",
        },
        {
          path: "additional_details.web_social_link",
          label: "Website Socials",
        },

        // policies fields
        { path: "policies.cancellation_policy", label: "Cancellation Policy" },
        { path: "policies.terms_and_conditions", label: "Terms & Conditions" },
      ];
      break;
    case "dj-artist":
    case "djartist":
    case "djArtist":
    case "dj":
      fieldsToCheck = [
        // basic_details fields
        {
          path: "basic_details.point_of_contact",
          label: "Point of Contact",
        },
        {
          path: "basic_details.service_contact_number",
          label: "Service Contact Number",
        },
        { path: "basic_details.description", label: "Description" },
        { path: "basic_details.service_areas", label: "Service Areas" },
        {
          path: "basic_details.service_location_dj_artist.service_address",
          label: "Service Address",
        },

        // service_details fields
        {
          path: "service_details.event_types_dj",
          label: "Event Types",
        },
        {
          path: "service_details.regional_specializations",
          label: "Regional Specializations",
        },
        {
          path: "service_details.services_offered",
          label: "Services Offered",
        },

        // additional_details fields
        {
          path: "additional_details.asset_images",
          label: "Photos",
        },
        {
          path: "additional_details.asset_videos",
          label: "Videos",
        },
        {
          path: "additional_details.prices_starts_from",
          label: "Price Starting From",
        },

        // policies fields
        { path: "policies.cancellation_policy", label: "Cancellation Policy" },
        { path: "policies.terms_and_conditions", label: "Terms & Conditions" },
      ];
      break;
    // Add criteria for other service types as needed

    default:
      console.log(`Unknown service type: ${serType}`);
      return false;
  }
  fieldsToCheck.forEach(({ path, label }) => {
    const fieldPath = path.split(".");
    let currentValue = service;

    for (let key of fieldPath) {
      if (currentValue[key] !== undefined && currentValue[key] !== null) {
        currentValue = currentValue[key];
      } else {
        console.log(`Field "${label}" (${path}) XXXXXXX`);
        allFieldsValid = false;
        return; // Field is not valid, exit early
      }
    }

    if (currentValue?.toString().trim()) {
      console.log(`Field "${label}" (${path}) OK`);
    } else {
      console.log(`Field "${label}" (${path}) XXXXXXX`);
      allFieldsValid = false;
    }
  });

  return allFieldsValid;
};

export const addVendorInvoice = async (req, res) => {
  const { invoice_url, vendor_id, service_id, type, customer_id, event_id } =
    req.body;

  console.log(
    `Received request to add invoice for vendor ${vendor_id} with URL ${invoice_url}`
  );

  try {
    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Save the invoice in invoices collection
    const invoice = new Invoices({
      invoice_url,
      vendor_id,
      service_id,
      type,
      customer_id,
      event_id,
    });

    await invoice.save();

    return res.status(200).json({
      message: "Invoice added successfully",
    });
  } catch (error) {
    console.error("Error adding invoice:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// 🛑 4. API endpoint to delete a service profile
export const deleteServiceProfile = async (req, res) => {
  // 🛑 1. Get vendorId from the request body (as requested)
  const { vendor_id: vendorIdFromRequest } = req.body;
  // 2. Get serviceId from the URL parameters
  const serviceId = req.params.service_id;

  // Use the vendorId from the body for the deletion
  const vendorId = vendorIdFromRequest;

  if (!vendorId || !serviceId) {
    return res
      .status(400)
      .json({ message: "Vendor ID and Service ID are required for deletion." });
  }

  const { model: ServiceModel, name: serviceName } = getServiceModel(serviceId);

  if (!ServiceModel) {
    return res
      .status(400)
      .json({ message: "Invalid or unsupported service type detected." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- 1. DELETE THE SERVICE PROFILE (e.g., Caterer, Decorator) ---
    // Crucial check: ensures the vendorId matches the service profile
    const deleteServiceProfileResult = await ServiceModel.deleteOne(
      { service_id: serviceId, vendor_id: vendorId }, // 👈 Using vendorId from request body/frontend
      { session }
    );

    if (deleteServiceProfileResult.deletedCount === 0) {
      await session.abortTransaction();
      return res.status(404).json({
        message: `${serviceName} profile not found or does not belong to the provided vendor ID.`,
      });
    }

    // --- 2. CASCADE HARD DELETION ON ALL TRANSACTIONAL DATA (using serviceId) ---
    // Delete events scheduled for this service
    await Calendar.deleteMany({ service_id: serviceId }, { session });

    // Delete all chat threads where this service is involved
    await Chat2.deleteMany({ service_id: serviceId }, { session });

    // Delete all event/booking records created for this service
    await Events.deleteMany({ service_id: serviceId }, { session });

    // Delete all invoices generated for this service
    await Invoices.deleteMany({ service_id: serviceId }, { session });

    // Delete all orders made for this service
    await Orders.deleteMany({ service_id: serviceId }, { session });

    // Delete all quotation requests made to this service
    await Quotations.deleteMany({ service_id: serviceId }, { session });

    // Delete all customer reviews submitted for this service
    await Reviews.deleteMany({ service_id: serviceId }, { session });

    // Delete all vendor notifications linked to this service
    await VendorNotifications.deleteMany(
      { service_id: serviceId },
      { session }
    );

    // --- 3. UPDATE CUSTOMER WISHLISTS (Remove serviceId) ---
    await Customer.updateMany(
      { wishlisted_services: serviceId },
      { $pull: { wishlisted_services: serviceId } },
      { session }
    );

    // --- 4. UPDATE THE VENDOR MASTER PROFILE (Remove service entry) ---
    const updateVendorResult = await Vendor.updateOne(
      { vendor_id: vendorId },
      {
          $pull: {
              // 🛑 CORRECTED: Pull the serviceId string from the 'services' array
              services: serviceId, 
              
              // This remains correct, targeting the object in service_types array
              service_types: { service_id: serviceId }
          }
      },
      { session }
  );

    await session.commitTransaction();

    return res.status(200).json({
      message: `${serviceName} service and all associated data permanently deleted.`,
      vendorUpdateStatus: updateVendorResult.modifiedCount,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(`Transaction aborted for service ${serviceId}:`, error);

    return res.status(500).json({
      message:
        "A critical database error occurred. The deletion was rolled back to ensure data integrity.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ... (helper variables and functions: serviceFields, calculateProfileCompletion, checkVerification, addVendorInvoice)
