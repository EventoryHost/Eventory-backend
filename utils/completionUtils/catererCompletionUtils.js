// utils/completionUtils/catererCompletionUtils.js
import { Caterer } from "../../models/caterer.js";

export const checkCatererProfileCompletion = async (catererId) => {
  try {
    console.log(
      `Checking profile completion for caterer with ID: ${catererId}`,
    );

    const caterer = await Caterer.findOne({ id: catererId });
    if (!caterer) {
      console.error(`Caterer with ID ${catererId} not found`);
      throw new Error("Caterer not found");
    }

    // Check if basic details are complete
    console.log("Checking basic details...");
    const basicDetailsComplete =
      caterer.basicDetails.name &&
      caterer.basicDetails.managerName &&
      caterer.basicDetails.capacity &&
      caterer.basicDetails.description &&
      caterer.basicDetails.cuisine_specialities.length > 0 &&
      caterer.basicDetails.regional_specialities.length > 0 &&
      caterer.basicDetails.service_style_offered.length > 0;
    console.log(`Basic Details Complete: ${basicDetailsComplete}`);

    // Update completed flag for basic details
    await Caterer.findOneAndUpdate(
      { id: catererId },
      {
        "basicDetails.completed": basicDetailsComplete,
      },
    );

    // Check if menu details are complete
    console.log("Checking menu details...");
    const menuDetailsComplete =
      caterer.menuDetails.menu.length > 0 &&
      caterer.menuDetails.pre_set_menus.length > 0 &&
      caterer.menuDetails.customizable !== undefined;
    console.log(`Menu Details Complete: ${menuDetailsComplete}`);

    // Update completed flag for menu details
    await Caterer.findOneAndUpdate(
      { id: catererId },
      {
        "menuDetails.completed": menuDetailsComplete,
      },
    );

    // Check if event details are complete
    console.log("Checking event details...");
    const eventDetailsComplete =
      caterer.eventDetails.event_types_catered.length > 0 &&
      caterer.eventDetails.additional_services.length > 0;
    console.log(`Event Details Complete: ${eventDetailsComplete}`);

    // Update completed flag for event details
    await Caterer.findOneAndUpdate(
      { id: catererId },
      {
        "eventDetails.completed": eventDetailsComplete,
      },
    );

    // Check if staff and equipment details are complete
    console.log("Checking staff and equipment details...");
    const staffAndEquipmentComplete =
      caterer.staffAndEquipmentDetails.staff_provided.length > 0 &&
      caterer.staffAndEquipmentDetails.equipment_provided.length > 0;
    console.log(
      `Staff and Equipment Details Complete: ${staffAndEquipmentComplete}`,
    );

    // Update completed flag for staff and equipment details
    await Caterer.findOneAndUpdate(
      { id: catererId },
      {
        "staffAndEquipmentDetails.completed": staffAndEquipmentComplete,
      },
    );

    // Check if additional details are complete
    console.log("Checking additional details...");
    const additionalDetailsComplete =
      caterer.additionalDetails.photos.length > 0 &&
      caterer.additionalDetails.videos.length > 0 &&
      caterer.additionalDetails.tasting_sessions !== undefined &&
      caterer.additionalDetails.business_licenses !== undefined &&
      caterer.additionalDetails.food_safety_certificates.length > 0 &&
      caterer.additionalDetails.priceStartingFrom &&
      caterer.additionalDetails.advance_booking_period &&
      caterer.additionalDetails.minimum_order_requirements;
    console.log(`Additional Details Complete: ${additionalDetailsComplete}`);
    const check = additionalDetailsComplete ? "true" : "false";
    // Update completed flag for additional details
    await Caterer.findOneAndUpdate(
      { id: catererId },
      {
        "additionalDetails.completed": check,
      },
    );

    // Check if termsAndConditions is filled (Ensure it's a URL or any non-empty string)
    console.log("Checking termsAndConditions...");
    let termsComplete = false;
    if (
      caterer.policies &&
      caterer.policies.termsAndConditions &&
      caterer.policies.termsAndConditions.trim() !== ""
    ) {
      termsComplete = true;
    }
    console.log(`Terms and Conditions Complete: ${termsComplete}`);

    // Check if client_testimonials is filled (Ensure it's a URL or any non-empty string)
    console.log("Checking client_testimonials...");
    let testimonialsComplete = false;
    if (
      caterer.policies &&
      caterer.policies.client_testimonials &&
      caterer.policies.client_testimonials.trim() !== ""
    ) {
      testimonialsComplete = true;
    }
    console.log(`Client Testimonials Complete: ${testimonialsComplete}`);

    // Check if cancellationPolicy is filled (Ensure it's a URL or any non-empty string)
    console.log("Checking cancellationPolicy...");
    let cancellationComplete = false;
    if (
      caterer.policies &&
      caterer.policies.cancellationPolicy &&
      caterer.policies.cancellationPolicy.trim() !== ""
    ) {
      cancellationComplete = true;
    }
    console.log(`Cancellation Policy Complete: ${cancellationComplete}`);

    // If all of the fields are filled, mark policies as completed
    if (termsComplete && testimonialsComplete && cancellationComplete) {
      await Caterer.findOneAndUpdate(
        { id: catererId },
        { "policies.completed": true },
      );
    }

    console.log(
      `Profile completion check completed for caterer with ID: ${catererId}`,
    );
    return true;
  } catch (error) {
    console.error("Error checking caterer profile completion:", error);
    throw error;
  }
};
