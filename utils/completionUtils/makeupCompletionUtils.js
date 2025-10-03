import MakeupArtist from "../../models/makeupArtists.js";

export const checkMakeupArtistProfileCompletion = async (artistId) => {
  try {
    const artist = await MakeupArtist.findOne({ service_id: artistId });

    if (!artist) {
      throw new Error("Makeup Artist not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      artist.basic_details.point_of_contact &&
      artist.basic_details.service_contact_number &&
      artist.basic_details.min_booking_capacity &&
      artist.basic_details.max_booking_capacity &&
      artist.basic_details.description &&
      artist.basic_details.event_types_makeup.length > 0 &&
      artist.basic_details.types_of_makeup_artists_available.length > 0 &&
      artist.basic_details.service_location_make_up;

    console.log(`Basic details check: ------- ${basicDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { "basic_details.is_completed": basicDetailsComplete },
    );

    // Check if service_details are complete
    const serviceDetailsComplete =
      artist.service_details.is_onsite_makeup_available &&
      artist.service_details.is_customization_possible &&
      artist.service_details.service_types.length > 0;

    console.log(`Service details check: ----- ${serviceDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { "service_details.is_completed": serviceDetailsComplete },
    );

    // Check if additional details are complete
    const additionalDetailsComplete =
      artist.additional_details.asset_images.length > 0 &&
      artist.additional_details.asset_videos.length > 0 &&
      artist.additional_details.min_booking_period &&
      artist.additional_details.max_booking_period &&
      artist.additional_details.prices_starts_from &&
      artist.additional_details.ig_socials_link &&
      artist.additional_details.web_social_link;

    console.log(`Additional details check: ----- ${additionalDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { service_id: artistId },
      { "additional_details.is_completed": additionalDetailsComplete },
    );

    // Check if policies are complete
    const policiesComplete =
      artist.policies.termsAndConditions.length > 0 &&
      artist.policies.cancellationPolicy.length > 0 ;

    console.log(`Policies check: ----- ${policiesComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { id: artistId },
      { "policies.is_completed": policiesComplete },
    );

    return true;
  } catch (error) {
    console.error("Error checking makeup artist profile completion:", error);
    throw error;
  }
};
