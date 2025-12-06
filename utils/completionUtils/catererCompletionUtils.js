// utils/completionUtils/catererCompletionUtils.js
import { Caterer } from "../../models/caterer.js";

export const checkCatererProfileCompletion = async (catererId) => {
  try {
    console.log(
      `Checking profile completion for caterer with ID: ${catererId}`
    );

    const caterer = await Caterer.findOne({ service_id: catererId });
    if (!caterer) {
      console.error(`Caterer with ID ${catererId} not found`);
      throw new Error("Caterer not found");
    }

    // Check if basic details are complete
    console.log("Checking basic details...");
    const basicDetailsComplete =
      caterer.basic_details.point_of_contact &&
      caterer.basic_details.service_contact_number &&
      caterer.basic_details.min_booking_capacity &&
      caterer.basic_details.max_booking_capacity &&
      caterer.basic_details.description &&
      caterer.basic_details.service_location_caterer &&
      caterer.basic_details.cuisine_specialities.length > 0 &&
      caterer.basic_details.regional_specialities.length > 0 &&
      caterer.basic_details.service_style_offered.length > 0;
    console.log(`Basic Details Complete: ${basicDetailsComplete}`);

    // Update completed flag for basic details
    await Caterer.findOneAndUpdate(
      { service_id: catererId },
      {
        "basic_details.is_completed": basicDetailsComplete,
      }
    );
    // Check if menu details are complete
    console.log("Checking Event details...");
    const eventDetailsComplete =
      caterer.event_details.event_types_catered.length > 0 &&
      caterer.event_details.staff_provided.length > 0 &&
      caterer.event_details.veg_or_nonveg &&
      caterer.event_details.additional_services_for_any_event.length > 0 &&
      caterer.event_details.equipment_provided.length > 0 &&
      caterer.event_details.special_dietary_options.length > 0 &&
      caterer.event_details.menu_customizable !== undefined &&
      (caterer.event_details.menu.length > 0 ||
        (caterer.event_details.appetizers.length > 0 &&
          caterer.event_details.main_course.length > 0 &&
          caterer.event_details.beverages.length > 0)) &&
      caterer.event_details.pre_set_menus.length > 0;

    console.log(`Event Details Complete: ${eventDetailsComplete}`);

    // Update completed flag for menu details
    await Caterer.findOneAndUpdate(
      { service_id: catererId },
      {
        "event_details.is_completed": eventDetailsComplete,
      }
    );

    // Check if additional details are complete
    console.log("Checking additional details...");
    const additionalDetailsComplete =
      caterer.additional_details.min_booking_period &&
      caterer.additional_details.max_booking_period &&
      caterer.additional_details.asset_images.length > 0 &&
      caterer.additional_details.asset_videos.length > 0 &&
      caterer.additional_details.is_tasting_session_provided !== undefined &&
      caterer.additional_details.is_tasting_session_provided !== null &&
      caterer.additional_details.is_business_license_available !== undefined &&
      caterer.additional_details.is_business_license_available !== null &&
      caterer.additional_details.food_safety_certificates.length > 0 &&
      caterer.additional_details.prices_starts_from != null;

    console.log(`Additional Details Complete: ${additionalDetailsComplete}`);

    // Update completed flag for additional details with real boolean
    await Caterer.findOneAndUpdate(
      { service_id: catererId },
      {
        "additional_details.is_completed": additionalDetailsComplete,
      }
    );

    // Check if termsAndConditions is filled (Ensure it's a URL or any non-empty string)
    console.log("Checking termsAndConditions...");
    let termsComplete = false;
    if (
      caterer.policies &&
      caterer.policies.terms_and_conditions &&
      caterer.policies.terms_and_conditions.trim() !== ""
    ) {
      termsComplete = true;
    }
    console.log(`Terms and Conditions Complete: ${termsComplete}`);

    // Check if cancellation_policy is filled (Ensure it's a URL or any non-empty string)
    console.log("Checking cancellation_policy...");
    let cancellationComplete = false;
    if (
      caterer.policies &&
      caterer.policies.cancellation_policy &&
      caterer.policies.cancellation_policy.trim() !== ""
    ) {
      cancellationComplete = true;
    }
    console.log(`Cancellation Policy Complete: ${cancellationComplete}`);

    // If all of the fields are filled, mark policies as completed
    if (termsComplete  && cancellationComplete) {
      await Caterer.findOneAndUpdate(
        { service_id: catererId },
        { "policies.is_completed": true }
      );
    }

    console.log(
      `Profile completion check completed for caterer with ID: ${catererId}`
    );
    return true;
  } catch (error) {
    console.error("Error checking caterer profile completion:", error);
    throw error;
  }
};
