import { Venue } from "../../models/venue.js"; 

export const checkVenueProfileCompletion = async (venueId) => {
  try {
    const venue = await Venue.findOne({ id: venueId });

    if (!venue) {
      throw new Error('Venue not found');
    }

    // Check if basic details are complete
    const basicDetailsComplete = (
      venue.basicDetails.name &&
      venue.basicDetails.managerName &&
      venue.basicDetails.capacity &&
      venue.basicDetails.operatingHours.openingTime &&
      venue.basicDetails.operatingHours.closingTime &&
      venue.basicDetails.address &&
      venue.basicDetails.description
    );

    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    await Venue.findOneAndUpdate({ id: venueId }, {
      "basicDetails.completed": basicDetailsComplete,
    });

    // Check if feature details are complete
    const featureDetailsComplete = (
      venue.featureDetails.catererServices &&
      venue.featureDetails.decorServices &&
      venue.featureDetails.venueTypes &&
      venue.featureDetails.audioVisualEquipment &&
      venue.featureDetails.accessibilityFeatures &&
      venue.featureDetails.restrictionsPolicies &&
      venue.featureDetails.specialFeatures &&
      venue.featureDetails.facilities
    );

    console.log(`Feature details check: ------- ${featureDetailsComplete}`);

    await Venue.findOneAndUpdate({ id: venueId }, {
      "featureDetails.completed": featureDetailsComplete,
    });

    // Check if additional details are complete
    const additionalDetailsComplete = (
      venue.additionalDetails.photos.length > 0 &&
      venue.additionalDetails.videos.length > 0 &&
      venue.additionalDetails.awards != null &&
      venue.additionalDetails.clientTestimonials != null &&
      venue.additionalDetails.instagramURL != null &&
      venue.additionalDetails.websiteURL != null &&
      venue.additionalDetails.advanceBookingPeriod != null &&
      venue.additionalDetails.priceStartingFrom != null
    );

    console.log(`Additional details check: ------- ${additionalDetailsComplete}`);

    await Venue.findOneAndUpdate({ id: venueId }, {
      "additionalDetails.completed": additionalDetailsComplete,
    });

    // Check if policies are complete
    const cancellationComplete = (
      typeof venue.policies.cancellationPolicy === 'string' &&
      venue.policies.cancellationPolicy.trim() !== ''
    );

    const termsComplete = (
      typeof venue.policies.termsConditions === 'string' &&
      venue.policies.termsConditions.trim() !== ''
    );

    const policiesComplete = cancellationComplete && termsComplete;

    console.log(`Policies check: ------- ${policiesComplete}`);

    await Venue.findOneAndUpdate({ id: venueId }, {
      "policies.completed": policiesComplete,
    });

    return true;
  } catch (error) {
    console.error('Error checking venue profile completion:', error);
    throw error;
  }
};
