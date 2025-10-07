import photographerVideographer from "../../models2/photographerVideographer.js";

export const checkPhotographerProfileCompletion = async (photographerId) => {
  try {
    const photographer = await photographerVideographer.findOne({
      service_id: photographerId,
    });

    if (!photographer) {
      throw new Error("Photographer not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      !!photographer.basic_details.point_of_contact &&
      !!photographer.basic_details.service_contact_number &&
      !!photographer.basic_details.description &&
      !!photographer.basic_details.min_booking_capacity &&
      !!photographer.basic_details.max_booking_capacity &&
      photographer.basic_details.event_types_captured.length > 0 &&
      photographer.basic_details.send_proposals_to_clients !== undefined &&
      photographer.basic_details.send_proposals_to_clients !== null &&
      photographer.basic_details.do_initial_customer_consultation !==
        undefined &&
      photographer.basic_details.do_initial_customer_consultation !== null &&
      photographer.basic_details.do_destination_events !== undefined &&
      photographer.basic_details.do_destination_events !== null &&
      photographer.basic_details.do_advance_setup !== undefined &&
      photographer.basic_details.do_advance_setup !== null &&
      photographer.basic_details.do_post_production_services !== undefined &&
      photographer.basic_details.do_post_production_services !== null &&
      !!photographer.basic_details.service_location_pav ;

    // Log the result of the basic details check
    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    // Update completed flag for basic details
    await photographerVideographer.findOneAndUpdate(
      { service_id: photographerId },
      {
        "basic_details.is_completed": basicDetailsComplete,
      }
    );

    // Check if service details are complete
    const serviceDetailsComplete =
      !!photographer.service_details.type_of_service &&
      photographer.service_details.types_of_equipment_available.length > 0 &&
      photographer.service_details.types_of_styles_offered.length > 0 &&
      photographer.service_details.add_ons_upgrade_available.length > 0 &&
      photographer.service_details.final_delivery_methods.length > 0 &&
      !!photographer.service_details.service_offering_type &&
      !!photographer.service_details.delivery_timeline;

    // Log the result of the service details check
    console.log(`Service details check: ------- ${serviceDetailsComplete}`);

    // Update completed flag for service details
    await photographerVideographer.findOneAndUpdate(
      { service_id: photographerId },
      {
        "service_details.is_completed": serviceDetailsComplete,
      }
    );

    // Check if additional details are complete
    const additionalDetailsComplete =
      photographer.additional_details.asset_images.length > 0 &&
      photographer.additional_details.asset_videos.length > 0 &&
      !!photographer.additional_details.min_booking_period &&
      !!photographer.additional_details.max_booking_period &&
      !!photographer.additional_details.prices_starts_from &&
      !!photographer.additional_details.ig_socials_link &&
      !!photographer.additional_details.web_social_link;

    // Log the result of the additional details check
    console.log(
      `Additional details check: ------- ${additionalDetailsComplete}`
    );

    // Update completed flag for additional details
    await photographerVideographer.findOneAndUpdate(
      { service_id: photographerId },
      {
        "additional_details.is_completed": additionalDetailsComplete,
      }
    );

    // Check if policies are complete (cancellation and terms only)
    const cancellationComplete =
      typeof photographer.policies.cancellation_policy === "string" &&
      photographer.policies.cancellation_policy.trim() !== "";

    const termsComplete =
      typeof photographer.policies.terms_and_conditions === "string" &&
      photographer.policies.terms_and_conditions.trim() !== "";

    // Log the result of the policies check
    console.log(
      `Policies check: ------- ${cancellationComplete && termsComplete}`
    );

    // Policies are considered complete if both cancellation and terms are filled
    const policiesComplete = cancellationComplete && termsComplete;

    // Update completed flag for policies
    await photographerVideographer.findOneAndUpdate(
      { service_id: photographerId },
      {
        "policies.is_completed": policiesComplete,
      }
    );

    return true;
  } catch (error) {
    console.error("Error checking photographer profile completion:", error);
    throw error;
  }
};
