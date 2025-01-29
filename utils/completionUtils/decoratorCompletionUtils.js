import { Decorator } from "../../models/decoraters.js";

export const checkDecoratorProfileCompletion = async (decoratorId) => {
  try {
    const decorator = await Decorator.findOne({ id: decoratorId });

    if (!decorator) {
      throw new Error("Decorator not found");
    }

    // Check if basic details are complete (only check for non-empty fields)
    const basicDetailsComplete = (
      decorator.basicDetails.name &&
      decorator.basicDetails.eventSize &&
      decorator.basicDetails.description &&
      decorator.basicDetails.eventTypes.types.length > 0
    );

    // Log the result of the basic details check
    console.log(`Basic details check: ------- ${basicDetailsComplete}`);

    // Update completed flag for basic details
    await Decorator.findOneAndUpdate({ id: decoratorId }, {
      "basicDetails.completed": basicDetailsComplete,
    });

    // Check if themes offered are complete (only check for non-empty fields)
    const themesOfferedComplete = (
      decorator.themesOffered.themesOffered.length > 0 &&
      decorator.themesOffered.propSelection != null &&
      decorator.themesOffered.colorSchemeAssistance != null &&
      decorator.themesOffered.themeCustomization != null &&
      decorator.themesOffered.venueAdaptability != null
    );    

    // Log the result of the themes offered check
    console.log(`Themes offered check: ----- ${themesOfferedComplete}`);

    // Update completed flag for themes offered
    await Decorator.findOneAndUpdate({ id: decoratorId }, {
      "themesOffered.completed": themesOfferedComplete,
    });

    // Check if themes elements are complete (only check for non-empty fields)
    const themesElementComplete = (
      decorator.themesElement.themeElements.length > 0 &&
      decorator.themesElement.themePhotos.length > 0 &&
      decorator.themesElement.themeVideos.length > 0
    );

    // Log the result of the themes elements check
    console.log(`Themes elements check: ----- ${themesElementComplete}`);

    // Update completed flag for themes element
    await Decorator.findOneAndUpdate({ id: decoratorId }, {
      "themesElement.completed": themesElementComplete,
    });

    // Check if additional details are complete (only check for non-empty fields)
    const additionalDetailsComplete = (
      decorator.additionalDetails.photos.length > 0 &&
      decorator.additionalDetails.videos.length > 0 &&
      decorator.additionalDetails.advanceBookingPeriod &&
      decorator.additionalDetails.priceStartingFrom != null &&
      decorator.additionalDetails.themeProposels != null &&
      // decorator.additionalDetails.proposalRevisions != null &&
      decorator.additionalDetails.clientTestimonials != null &&
      // decorator.additionalDetails.awards &&
      // decorator.additionalDetails.website &&
      decorator.additionalDetails.instagram != null
    );

    // Log the result of the additional details check
    console.log(`Additional details check: ----- ${additionalDetailsComplete}`);

    // Update completed flag for additional details
    await Decorator.findOneAndUpdate({ id: decoratorId }, {
      "additionalDetails.completed": additionalDetailsComplete,
    });

    // Check if policies are complete (cancellation and terms only, just checking if non-empty)
    const cancellationComplete = (
      decorator.policies.cancellationPolicy && decorator.policies.cancellationPolicy.trim() !== ''
    );

    const termsComplete = (
      decorator.policies.termsAndConditions && decorator.policies.termsAndConditions.trim() !== ''
    );

    // Log the result of the policies check
    console.log(`Policies check: ----- ${cancellationComplete && termsComplete}`);

    // Policies are considered complete if both cancellation and terms are filled
    const policiesComplete = cancellationComplete && termsComplete;

    // Update completed flag for policies
    await Decorator.findOneAndUpdate({ id: decoratorId }, {
      "policies.completed": policiesComplete,
    });

    return true;
  } catch (error) {
    console.error("Error checking decorator profile completion:", error);
    throw error;
  }
};
