import { Decorator } from "../../models/decoraters.js";

export const checkDecoratorProfileCompletion = async (decoratorId) => {
  try {
    const decorator = await Decorator.findById(decoratorId);

    if (!decorator) {
      throw new Error("Decorator not found");
    }

    // Check if basic details are complete
    const basicDetailsComplete = (
      decorator.basicDetails.name &&
      decorator.basicDetails.eventSize &&
      decorator.basicDetails.description &&
      decorator.basicDetails.eventTypes.types.length > 0
    );

    // Update completed flag for basic details
    await Decorator.findByIdAndUpdate(decoratorId, {
      "basicDetails.completed": basicDetailsComplete,
    });

    // Check if themes offered are complete
    const themesOfferedComplete = (
      decorator.themesOffered.themesOffered.length > 0 &&
      typeof decorator.themesOffered.propSelection === "boolean" &&
      typeof decorator.themesOffered.colorSchemeAssistance === "boolean" &&
      typeof decorator.themesOffered.themeCustomization === "boolean" &&
      typeof decorator.themesOffered.venueAdaptability === "boolean"
    );

    // Update completed flag for themes offered
    await Decorator.findByIdAndUpdate(decoratorId, {
      "themesOffered.completed": themesOfferedComplete,
    });

    // Check if themes elements are complete
    const themesElementComplete = (
      decorator.themesElement.themeElements.length > 0 &&
      decorator.themesElement.themePhotos.length > 0 &&
      decorator.themesElement.themeVideos.length > 0
    );

    // Update completed flag for themes element
    await Decorator.findByIdAndUpdate(decoratorId, {
      "themesElement.completed": themesElementComplete,
    });

    // Check if additional details are complete
    const additionalDetailsComplete = (
      decorator.additionalDetails.photos.length > 0 &&
      decorator.additionalDetails.videos.length > 0 &&
      decorator.additionalDetails.advanceBookingPeriod &&
      decorator.additionalDetails.priceStartingFrom
    );

    // Update completed flag for additional details
    await Decorator.findByIdAndUpdate(decoratorId, {
      "additionalDetails.completed": additionalDetailsComplete,
    });

    // Check if policies are complete
    const policiesComplete = (
      decorator.policies.cancellationPolicy &&
      decorator.policies.termsAndConditions
    );

    // Update completed flag for policies
    await Decorator.findByIdAndUpdate(decoratorId, {
      "policies.completed": policiesComplete,
    });

    return true;
  } catch (error) {
    console.error("Error checking decorator profile completion:", error);
    throw error;
  }
};
