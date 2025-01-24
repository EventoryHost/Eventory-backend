import Photographer from '../../models/photographers.js';

export const checkPhotographerProfileCompletion = async (photographerId) => {
  try {
    const photographer = await Photographer.findById(photographerId);

    if (!photographer) {
      throw new Error('Photographer not found');
    }

    // Check if basic details are complete
    const basicDetailsComplete = (
      photographer.basicDetails.name &&
      photographer.basicDetails.description &&
      photographer.basicDetails.eventSize &&
      photographer.basicDetails.eventTypes.length > 0
    );

    await Photographer.findByIdAndUpdate(photographerId, {
      "basicDetails.completed": basicDetailsComplete,
    });

    // Check if Videography section is complete
    const videographyComplete = (
      photographer.Videography.equipmentAvailable.length > 0 &&
      photographer.Videography.typesOfStyles.length > 0 &&
      photographer.Videography.addonsOrUpgradeAvailable.length > 0 &&
      photographer.Videography.finalDeliveryMethods.length > 0
    );

    await Photographer.findByIdAndUpdate(photographerId, {
      "Videography.completed": videographyComplete,
    });

    // Check if Photography section is complete
    const photographyComplete = (
      photographer.Photography.equipmentAvailable.length > 0 &&
      photographer.Photography.typesOfStyles.length > 0 &&
      photographer.Photography.addonsOrUpgradeAvailable.length > 0 &&
      photographer.Photography.finalDeliveryMethods.length > 0
    );

    await Photographer.findByIdAndUpdate(photographerId, {
      "Photography.completed": photographyComplete,
    });

    // Check if consultation details are complete
    const consultationComplete = (
      photographer.consultationDetails.duration &&
      photographer.consultationDetails.PackageTypes &&
      photographer.consultationDetails.proposalsToClients &&
      photographer.consultationDetails.freeInitialConsultation &&
      photographer.consultationDetails.bookingDeposit &&
      photographer.consultationDetails.availableForDestinationEvents &&
      photographer.consultationDetails.AdvanceSetup &&
      photographer.consultationDetails.postProductionServices
    );

    await Photographer.findByIdAndUpdate(photographerId, {
      "consultationDetails.completed": consultationComplete,
    });

    // Check if additional details are complete
    const additionalDetailsComplete = (
      photographer.additionalDetails.photos.length > 0 &&
      photographer.additionalDetails.videos.length > 0 &&
      photographer.additionalDetails.priceStartingFrom
    );

    await Photographer.findByIdAndUpdate(photographerId, {
      "additionalDetails.completed": additionalDetailsComplete,
    });

    // Check if policies are complete
    const policiesComplete = (
      photographer.policies.cancellationPolicy.length > 0 &&
      photographer.policies.termsAndConditions.length > 0
    );

    await Photographer.findByIdAndUpdate(photographerId, {
      "policies.completed": policiesComplete,
    });

    return true;
  } catch (error) {
    console.error('Error checking photographer profile completion:', error);
    throw error;
  }
};
