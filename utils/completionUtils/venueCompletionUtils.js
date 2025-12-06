import VenueProvider from "../../models/venueProvider.js";

export const checkVenueProfileCompletion = async (venueId) => {
  try {
    const venue = await VenueProvider.findOne({ service_id: venueId });

    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      !!venue.basic_details.point_of_contact &&
      !!venue.basic_details.service_contact_number &&
      !!venue.basic_details.description &&
      !!venue.basic_details.min_booking_capacity &&
      !!venue.basic_details.max_booking_capacity &&
      !!venue.basic_details.venue_name &&
      Array.isArray(venue.basic_details.event_types_venue) &&
      venue.basic_details.event_types_venue.length > 0 &&
      !!venue.basic_details.service_location_venue?.service_address &&
      !!venue.basic_details.service_location_venue?.lat &&
      !!venue.basic_details.service_location_venue?.lon &&
      !!venue.basic_details.service_location_venue?.service_pincode &&
      Array.isArray(venue.service_areas) &&
      venue.service_areas.length > 0;

    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "basic_details.is_completed": basicDetailsComplete,
      }
    );

    // Check if feature details are complete
    const featureDetailsComplete =
      venue.feature_details.in_house_catering !== undefined &&
      venue.feature_details.in_house_catering !== null &&
      venue.feature_details.in_house_decoration !== undefined &&
      venue.feature_details.in_house_decoration !== null &&
      Array.isArray(venue.feature_details.venue_types_available) &&
      venue.feature_details.venue_types_available.length > 0 &&
      Array.isArray(venue.feature_details.av_eqp_available_at_venue) &&
      venue.feature_details.av_eqp_available_at_venue.length > 0 &&
      Array.isArray(venue.feature_details.accessibility_features_of_venue) &&
      venue.feature_details.accessibility_features_of_venue.length > 0 &&
      Array.isArray(venue.feature_details.restriction_policies_on_venue) &&
      venue.feature_details.restriction_policies_on_venue.length > 0 &&
      Array.isArray(venue.feature_details.special_features_in_venue) &&
      venue.feature_details.special_features_in_venue.length > 0 &&
      Array.isArray(venue.feature_details.fascilities_at_venue) &&
      venue.feature_details.fascilities_at_venue.length > 0;

    console.log(`Feature details check: ------- ${featureDetailsComplete}`);

    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "feature_details.is_completed": featureDetailsComplete,
      }
    );

    // Check if additional details are complete (social links are optional)
    const additionalDetailsComplete =
      Array.isArray(venue.additional_details.asset_images) &&
      venue.additional_details.asset_images.length > 0 &&
      Array.isArray(venue.additional_details.asset_videos) &&
      venue.additional_details.asset_videos.length > 0 &&
      !!venue.additional_details.min_booking_period &&
      !!venue.additional_details.max_booking_period &&
      !!venue.additional_details.prices_starts_from;

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

    // Update the policies completion status in the database (Fixed: using service_id instead of id)
    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      {
        "policies.is_completed": policiesComplete,
      }
    );

    // Calculate overall profile completion score
    const totalSections = 4; // basic, feature, additional, policies
    let completedSections = 0;
    
    if (basicDetailsComplete) completedSections++;
    if (featureDetailsComplete) completedSections++;
    if (additionalDetailsComplete) completedSections++;
    if (policiesComplete) completedSections++;
    
    const profileCompletionScore = Math.round((completedSections / totalSections) * 100);
    
    await VenueProvider.findOneAndUpdate(
      { service_id: venueId },
      { profile_completion_score: profileCompletionScore }
    );

    console.log(`Overall profile completion score: ${profileCompletionScore}%`);

    return true;
  } catch (error) {
    console.error("Error checking venue profile completion:", error);
    throw error;
  }
};
