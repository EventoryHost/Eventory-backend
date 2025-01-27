import { Venue } from "../../models/venue.js";

export const checkVenueProfileCompletion = async (venueId) => {
  try {
    const venue = await Venue.findOne({ id: venueId });

    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      venue.basicDetails.name != null &&
      venue.basicDetails.managerName != null &&
      venue.basicDetails.capacity != null &&
      venue.basicDetails.operatingHours.openingTime != null &&
      venue.basicDetails.operatingHours.closingTime != null;
      // venue.basicDetails.address != null &&
      // venue.basicDetails.description != null

    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    await Venue.findOneAndUpdate(
      { id: venueId },
      {
        "basicDetails.completed": basicDetailsComplete,
      }
    );

    // Check if feature details are complete
    const featureDetailsComplete =
      venue.featureDetails.catererServices != null &&
      venue.featureDetails.decorServices != null &&
      venue.featureDetails.venueTypes != null &&
      venue.featureDetails.audioVisualEquipment != null &&
      venue.featureDetails.accessibilityFeatures != null &&
      venue.featureDetails.restrictionsPolicies != null &&
      venue.featureDetails.specialFeatures != null &&
      venue.featureDetails.facilities != null;

    console.log(`Feature details check: ------- ${featureDetailsComplete}`);

    await Venue.findOneAndUpdate(
      { id: venueId },
      {
        "featureDetails.completed": featureDetailsComplete,
      }
    );

    // Check if additional details are complete
    const additionalDetailsComplete =
      venue.additionalDetails.photos.length > 0 &&
      venue.additionalDetails.videos.length > 0 &&
      venue.additionalDetails.awards != null &&
      venue.additionalDetails.clientTestimonials != null &&
      // venue.additionalDetails.instagramURL != null &&
      // venue.additionalDetails.websiteURL != null &&
      venue.additionalDetails.advanceBookingPeriod != null &&
      venue.additionalDetails.priceStartingFrom != null;

    console.log(
      `Additional details check: ------- ${additionalDetailsComplete}`
    );

    await Venue.findOneAndUpdate(
      { id: venueId },
      {
        "additionalDetails.completed": additionalDetailsComplete,
      }
    );

    // Check if policies are complete
    const cancellationComplete =
      Array.isArray(venue.policies.cancellationPolicy) &&
      venue.policies.cancellationPolicy.length > 0 &&
      venue.policies.cancellationPolicy[0].trim().length > 0;

    const termsComplete =
      Array.isArray(venue.policies.termsConditions) &&
      venue.policies.termsConditions.length > 0 &&
      venue.policies.termsConditions[0].trim().length > 0;

    const insuranceComplete =
      Array.isArray(venue.policies.insurancePolicy) &&
      venue.policies.insurancePolicy.length > 0 &&
      venue.policies.insurancePolicy[0].trim().length > 0;

    const policiesComplete =
      cancellationComplete && termsComplete && insuranceComplete;

    console.log(`Policies check: ${policiesComplete}`);
    

    // Update the policies completion status in the database
    await Venue.findOneAndUpdate(
      { id: venueId },
      {
        "policies.completed": policiesComplete,
      }
    );

    return true;
  } catch (error) {
    console.error("Error checking venue profile completion:", error);
    throw error;
  }
};
