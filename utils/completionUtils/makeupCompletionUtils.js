import MakeupArtist from "../../models/makeupArtists.js";

export const checkMakeupArtistProfileCompletion = async (artistId) => {
  try {
    const artist = await MakeupArtist.findOne({ id: artistId });

    if (!artist) {
      throw new Error("Makeup Artist not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      artist.basicDetails.name &&
      artist.basicDetails.eventSize &&
      artist.basicDetails.description &&
      artist.basicDetails.eventTypes.length > 0 &&
      artist.basicDetails.serviceAreas.length > 0 &&
      artist.basicDetails.typesOfMakeupArtists.length > 0;

    console.log(`Basic details check: ------- ${basicDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { id: artistId },
      { "basicDetails.completed": basicDetailsComplete },
    );

    // Check if service details are complete
    const serviceDetailsComplete =
      artist.serviceDetails.onsiteMakeup != null &&
      artist.serviceDetails.customization != null &&
      artist.serviceDetails.serviceTypes.length > 0;

    console.log(`Service details check: ----- ${serviceDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { id: artistId },
      { "serviceDetails.completed": serviceDetailsComplete },
    );

    // Check if additional details are complete
    const additionalDetailsComplete =
      artist.additionalDetails.photos.length > 0 &&
      artist.additionalDetails.videos.length > 0 &&
      artist.additionalDetails.websiteUrl != null &&
      artist.additionalDetails.socialMedia != null &&
      artist.additionalDetails.priceStarts != null;

    console.log(`Additional details check: ----- ${additionalDetailsComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { id: artistId },
      { "additionalDetails.completed": additionalDetailsComplete },
    );

    // Check if policies are complete
    const policiesComplete =
      artist.policies.termsAndConditions.length > 0 &&
      artist.policies.cancellationPolicy.length > 0 &&
      artist.policies.clientTestimonials.length > 0 &&
      artist.policies.certificateOrAwards.length > 0;

    console.log(`Policies check: ----- ${policiesComplete}`);
    await MakeupArtist.findOneAndUpdate(
      { id: artistId },
      { "policies.completed": policiesComplete },
    );

    return true;
  } catch (error) {
    console.error("Error checking makeup artist profile completion:", error);
    throw error;
  }
};
