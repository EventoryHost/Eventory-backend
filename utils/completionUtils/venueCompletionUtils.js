import VenueProvider from "../../models2/venueProvider.js";

export const checkVenueProfileCompletion = async (venueId) => {
  try {
    const venue = await VenueProvider.findOne({ service_id: venueId });

    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      venue.basic_details.point_of_contact != null &&
      venue.basic_details.service_contact_number != null &&
      venue.basic_details.description != null &&
      venue.basic_details.min_booking_capacity != null &&
      venue.basic_details.max_booking_capacity != null &&
      venue.basic_details.venue_name != null &&
      venue.basic_details.service_type_details.length > 0 &&
      venue.basic_details.event_types_venue.length > 0 &&
      venue.basic_details.service_location_venue != null;

    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "basic_details.is_completed": basicDetailsComplete,
      }
    );

    // Check if feature details are complete
    const featureDetailsComplete =
  venue.feature_details.in_house_catering != null && // This is a boolean
  venue.feature_details.in_house_decoration != null && // This is a boolean
  venue.feature_details.venue_types_available.length > 0 &&
  venue.feature_details.av_eqp_available_at_venue.length > 0 &&
  venue.feature_details.accessibility_features_of_venue.length > 0 &&
  venue.feature_details.restriction_policies_on_venue.length > 0 &&
  venue.feature_details.special_features_in_venue.length > 0 &&
  venue.feature_details.fascilities_at_venue.length > 0;

    console.log(`Feature details check: ------- ${featureDetailsComplete}`);

    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "feature_details.is_completed": featureDetailsComplete,
      }
    );

    // Check if additional details are complete
    const additionalDetailsComplete =
    venue.additional_details.asset_images.length > 0 &&
    venue.additional_details.asset_videos.length > 0 &&
    !!venue.additional_details.min_booking_period &&
    !!venue.additional_details.max_booking_period &&
    !!venue.additional_details.prices_starts_from &&
    !!venue.additional_details.ig_socials_link &&
    !!venue.additional_details.web_social_link;

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
    const policiesComplete =
      !!venue.policies.cancellation_policy &&
      !!venue.policies.terms_and_conditions;

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
