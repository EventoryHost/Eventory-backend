import Photographer from "../../models/photographers.js";

export const checkPhotographerProfileCompletion = async (photographerId) => {
  try {
    const photographer = await Photographer.findOne({ id: photographerId });

    if (!photographer) {
      throw new Error("Photographer not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete =
      photographer.basicDetails.name &&
      photographer.basicDetails.description &&
      photographer.basicDetails.eventSize &&
      photographer.basicDetails.eventTypes.length > 0;

    // Log the result of the basic details check
    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    // Update completed flag for basic details
    await Photographer.findOneAndUpdate(
      { id: photographerId },
      {
        "basicDetails.completed": basicDetailsComplete,
      },
    );

    // Check if Videography section is complete
    const videographyComplete =
      photographer.Videography.equipmentAvailable.length > 0 &&
      photographer.Videography.typesOfStyles.length > 0 &&
      photographer.Videography.addonsOrUpgradeAvailable.length > 0 &&
      photographer.Videography.finalDeliveryMethods.length > 0;

    // Log the result of the videography check
    console.log(`Videography check: ------- ${videographyComplete}`);

    // Update completed flag for videography
    await Photographer.findOneAndUpdate(
      { id: photographerId },
      {
        "Videography.completed": videographyComplete,
      },
    );

    // Check if Photography section is complete
    const photographyComplete =
      photographer.Photography.equipmentAvailable.length > 0 &&
      photographer.Photography.typesOfStyles.length > 0 &&
      photographer.Photography.addonsOrUpgradeAvailable.length > 0 &&
      photographer.Photography.finalDeliveryMethods.length > 0;

    // Log the result of the photography check
    console.log(`Photography check: ------- ${photographyComplete}`);

    // Update completed flag for photography
    await Photographer.findOneAndUpdate(
      { id: photographerId },
      {
        "Photography.completed": photographyComplete,
      },
    );

    // Check if consultation details are complete
    const consultationComplete =
      photographer.consultationDetails.duration &&
      photographer.consultationDetails.PackageTypes &&
      photographer.consultationDetails.proposalsToClients &&
      photographer.consultationDetails.freeInitialConsultation &&
      photographer.consultationDetails.bookingDeposit &&
      photographer.consultationDetails.availableForDestinationEvents &&
      photographer.consultationDetails.AdvanceSetup &&
      photographer.consultationDetails.postProductionServices;

    // Log the result of the consultation check
    console.log(`Consultation details check: ------- ${consultationComplete}`);

    // Update completed flag for consultation details
    await Photographer.findOneAndUpdate(
      { id: photographerId },
      {
        "consultationDetails.completed": consultationComplete,
      },
    );

    // Check if additional details are complete
    const additionalDetailsComplete =
      photographer.additionalDetails.photos.length > 0 &&
      photographer.additionalDetails.videos.length > 0 &&
      photographer.additionalDetails.clientTestimonials != null &&
      photographer.additionalDetails.awards != null &&
      photographer.additionalDetails.website != null &&
      photographer.additionalDetails.instagram != null &&
      photographer.additionalDetails.priceStartingFrom != null;

    // Log the result of the additional details check
    console.log(
      `Additional details check: ------- ${additionalDetailsComplete}`,
    );

    // Update completed flag for additional details
    await Photographer.findOneAndUpdate(
      { id: photographerId },
      {
        "additionalDetails.completed": additionalDetailsComplete,
      },
    );

    // Check if policies are complete (cancellation and terms only)
    const cancellationComplete =
      typeof photographer.policies.cancellationPolicy === "string" &&
      photographer.policies.cancellationPolicy.trim() !== "";

    const termsComplete =
      typeof photographer.policies.termsAndConditions === "string" &&
      photographer.policies.termsAndConditions.trim() !== "";

    // Log the result of the policies check
    console.log(
      `Policies check: ------- ${cancellationComplete && termsComplete}`,
    );

    // Policies are considered complete if both cancellation and terms are filled
    const policiesComplete = cancellationComplete && termsComplete;

    // Update completed flag for policies
    await Photographer.findOneAndUpdate(
      { id: photographerId },
      {
        "policies.completed": policiesComplete,
      },
    );

    return true;
  } catch (error) {
    console.error("Error checking photographer profile completion:", error);
    throw error;
  }
};
