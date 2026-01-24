import { Decorator }  from "../../models/decorator.js";

export const checkDecoratorProfileCompletion = async (decoratorId) => {
  try {
    const decorator = await Decorator.findOne({ service_id: decoratorId });

    if (!decorator) {
      throw new Error("Decorator not found");
    }    // Check if basic details are complete (only check for non-empty fields)
    const basicDetailsComplete =
      decorator.basic_details.point_of_contact &&
      decorator.basic_details.service_contact_number &&
      decorator.basic_details.avg_setup_duration &&
      decorator.basic_details.description &&
      decorator.basic_details.event_types_decorated.length > 0 &&
      decorator.basic_details.service_location_decorator !== null;

    // Log the result of the basic details check
    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    // Update completed flag for basic details
    await Decorator.findOneAndUpdate(
      { service_id: decoratorId },
      {
        "basic_details.is_completed": basicDetailsComplete,
      },
    );

    // Check if themes offered are complete (only check for non-empty fields)
    const themesOfferedComplete =
      decorator.theme_details.themes_offered.length > 0 &&
      decorator.theme_details.is_prop_selection_available &&
      decorator.theme_details.any_custom_design_process.trim() !== "" &&
      decorator.theme_details.is_colour_scheme_assistance_provided &&
      decorator.theme_details.is_theme_customization_allowed &&
      decorator.theme_details.is_venue_adaptability &&
      decorator.theme_details.theme_elements_available.length > 0 &&
      decorator.theme_details.theme_portfolio_images.length > 0 &&
      decorator.theme_details.theme_portfolio_videos.length > 0;

    // Log the result of the themes offered check
    console.log(`Themes offered check: ----- ${themesOfferedComplete}`);

    // Update completed flag for themes offered
    await Decorator.findOneAndUpdate(
      { service_id: decoratorId },
      {
        "theme_details.is_completed": themesOfferedComplete,
      },
    );

    // Check if additional details are complete (only check for non-empty fields)
    const additionalDetailsComplete =
      decorator.additional_details.asset_images.length > 0 &&
      decorator.additional_details.asset_videos.length > 0 &&
      decorator.additional_details.min_booking_period &&
      decorator.additional_details.max_booking_period &&
      decorator.additional_details.prices_starts_from &&
      decorator.additional_details.ig_socials_link.trim() !== "" &&
      decorator.additional_details.web_social_link.trim() !== "" &&
      decorator.additional_details.is_theme_proposals_provided &&
      decorator.additional_details.is_proposal_revision_possible;

    // Log the result of the additional details check
    console.log(`Additional details check: ----- ${additionalDetailsComplete}`);

    // Update completed flag for additional details
    await Decorator.findOneAndUpdate(
      { service_id: decoratorId },
      {
        "additional_details.is_completed": additionalDetailsComplete,
      },
    );

    // Check if policies are complete (cancellation and terms only, just checking if non-empty)
    const cancellationComplete =
      decorator.policies.cancellation_policy &&
      decorator.policies.cancellation_policy.trim() !== "";

    const termsComplete =
      decorator.policies.terms_and_conditions &&
      decorator.policies.terms_and_conditions.trim() !== "";

    // Log the result of the policies check
    console.log(
      `Policies check: ----- ${cancellationComplete && termsComplete}`,
    );

    // Policies are considered complete if both cancellation and terms are filled
    const policiesComplete = Boolean(cancellationComplete && termsComplete);

    console.log(`policiesComplete: ----- ${policiesComplete}`);
    console.log(`Type of policiesComplete: ----- ${typeof policiesComplete}`);

    // Update completed flag for policies
    await Decorator.findOneAndUpdate(
      { service_id: decoratorId },
      {
        "policies.is_completed": policiesComplete,
      },
    );

    return true;
  } catch (error) {
    console.error("Error checking decorator profile completion:", error);
    throw error;
  }
};
