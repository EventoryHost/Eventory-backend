import { MakeupArtist } from "../../models/makeupArtist.js";

export const checkMakeupArtistProfileCompletion = async (artistId) => {
  try {
    const artist = await MakeupArtist.findOne({ service_id: artistId });

    if (!artist) {
      throw new Error("Makeup Artist not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      !!artist.basic_details.point_of_contact &&
      !!artist.basic_details.service_contact_number &&
      !!artist.basic_details.min_booking_capacity &&
      !!artist.basic_details.max_booking_capacity &&
      !!artist.basic_details.description &&
      Array.isArray(artist.basic_details.event_types_makeup) &&
      artist.basic_details.event_types_makeup.length > 0 &&
      Array.isArray(artist.basic_details.types_of_makeup_artists_available) &&
      artist.basic_details.types_of_makeup_artists_available.length > 0 &&
      !!artist.basic_details.service_location_make_up?.service_address &&
      !!artist.basic_details.service_location_make_up?.lat &&
      !!artist.basic_details.service_location_make_up?.lon &&
      !!artist.basic_details.service_location_make_up?.service_pincode &&
      Array.isArray(artist.service_areas) &&
      artist.service_areas.length > 0;

    console.log(`Basic details check: ----- ${basicDetailsComplete}`);

    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { "basic_details.is_completed": basicDetailsComplete }
    );

    // Check if service_details are complete
    const serviceDetailsComplete =
      artist.service_details.is_onsite_makeup_available !== undefined &&
      artist.service_details.is_onsite_makeup_available !== null &&
      artist.service_details.is_customization_possible !== undefined &&
      artist.service_details.is_customization_possible !== null &&
      Array.isArray(artist.service_details.service_types) &&
      artist.service_details.service_types.length > 0;

    console.log(`Service details check: ----- ${serviceDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { "service_details.is_completed": serviceDetailsComplete }
    );

    // Check if additional details are complete
    const additionalDetailsComplete =
      Array.isArray(artist.additional_details.asset_images) &&
      artist.additional_details.asset_images.length > 0 &&
      Array.isArray(artist.additional_details.asset_videos) &&
      artist.additional_details.asset_videos.length > 0 &&
      !!artist.additional_details.min_booking_period &&
      !!artist.additional_details.max_booking_period &&
      !!artist.additional_details.prices_starts_from;
      // Note: ig_socials_link and web_social_link are OPTIONAL fields

    console.log(`Additional details check: ----- ${additionalDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { "additional_details.is_completed": additionalDetailsComplete }
    );

    // Check if policies are complete
    const policiesComplete =
      !!artist.policies.terms_and_conditions &&
      !!artist.policies.cancellation_policy;

    console.log(`Policies check: ----- ${policiesComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { "policies.is_completed": policiesComplete }
    );

    // Calculate overall profile completion score
    const totalSections = 4; // basic, service, additional, policies
    let completedSections = 0;
    
    if (basicDetailsComplete) completedSections++;
    if (serviceDetailsComplete) completedSections++;
    if (additionalDetailsComplete) completedSections++;
    if (policiesComplete) completedSections++;
    
    const profileCompletionScore = Math.round((completedSections / totalSections) * 100);
    
    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { profile_completion_score: profileCompletionScore }
    );

    console.log(`Overall profile completion score: ${profileCompletionScore}%`);

    return true;
  } catch (error) {
    console.error("Error checking makeup artist profile completion:", error);
    throw error;
  }
};
