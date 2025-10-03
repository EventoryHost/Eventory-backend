import VenueProvider from "../../models2/venueProvider.js";

export const checkVenueProfileCompletion = async (venueId) => {
  try {
    const venue = await VenueProvider.findOne({ service_id: venueId });

    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      venue.basic_details.pointOfContact != null &&
      venue.basic_details.serviceContactNumber != null &&
      venue.basic_details.description != null &&
      venue.basic_details.minBookingCapacity != null &&
      venue.basic_details.maxBookingCapacity != null &&
      venue.basic_details.venueName != null &&
      venue.basic_details.serviceTypeDetails != null &&
      venue.basic_details.eventTypesVenue != null &&
      venue.basic_details.serviceLocationVenue != null;

    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "basic_details.is_completed": basicDetailsComplete,
      }
    );

    // Check if feature details are complete
    const featureDetailsComplete =
      venue.feature_details.in_house_catering != null &&
      venue.feature_details.in_house_decoration != null &&
      venue.feature_details.venueTypesAvailable != null &&
      venue.feature_details.avEqpAvailableAtVenue != null &&
      venue.feature_details.accessibilityFeaturesOfVenue != null &&
      venue.feature_details.restrictionPoliciesOnVenue != null &&
      venue.feature_details.specialFeaturesInVenue != null &&
      venue.feature_details.fascilitiesAtVenue != null;

    console.log(`Feature details check: ------- ${featureDetailsComplete}`);

    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "feature_details.is_completed": featureDetailsComplete,
      }
    );

    // Check if additional details are complete
    const additionalDetailsComplete = Boolean(
      venue.additional_details.asset_images.length > 0 &&
        venue.additional_details.asset_videos.length > 0 &&
        venue.additional_details.min_booking_period &&
        venue.additional_details.max_booking_period &&
        venue.additional_details.prices_starts_from &&
        venue.additional_details.ig_socials_link &&
        venue.additional_details.web_social_link
    );

    console.log(
      `Additional details check: ------- ${additionalDetailsComplete}`
    );

    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "additional_details.is_completed": additionalDetailsComplete,
      }
    );

    // Check if policies are complete
    const cancellationComplete =
      Array.isArray(venue.policies.cancellation_policy) &&
      venue.policies.cancellation_policy.length > 0 &&
      venue.policies.cancellation_policy[0].trim().length > 0;

    const termsComplete =
      Array.isArray(venue.policies.terms_and_conditions) &&
      venue.policies.terms_and_conditions.length > 0 &&
      venue.policies.terms_and_conditions[0].trim().length > 0;

    const policiesComplete = Boolean(
      cancellationComplete && termsComplete 
    );

    console.log(`Policies check--------------: ${policiesComplete}`);

    // Update the policies completion status in the database
    await VenueProvider.findOneAndUpdate(
      { id: venueId },
      {
        "policies.is_completed": policiesComplete,
      }
    );

    return true;
  } catch (error) {
    console.error("Error checking venue profile completion:", error);
    throw error;
  }
};
