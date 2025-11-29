import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config();

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const queueUrl =
  "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue";

const generateAndStoreAgreement = async (req, res) => {
  try {
    const { serviceType, vendorId } = req.params;
    console.log("Received request:", { serviceType, vendorId });
    const agreementData = req.body;

    console.log("Received agreement request:", { serviceType, vendorId });
    console.log("Agreement data keys:", Object.keys(agreementData));

    if (!serviceType || !vendorId) {
      console.error("Missing serviceType or vendorId");
      return res.status(400).json({
        success: false,
        message: "Service type and vendor ID are required",
      });
    }

    if (
      !agreementData ||
      !agreementData.vendorData ||
      !agreementData.signature
    ) {
      console.error("Missing agreement data or signature");
      return res.status(400).json({
        success: false,
        message: "Agreement data and signature are required",
      });
    }

    const sqsMessage = {
      type: 2, 
      serviceType,
      vendorId,
      agreementData,
    };

    console.log("Sending agreement generation message to SQS queue...");

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(sqsMessage),
    });

    await sqs.send(command);

    console.log(
      `Agreement generation queued successfully for vendor: ${vendorId}, service: ${serviceType}`
    );

    res.json({
      success: true,
      message: "Agreement generated and stored successfully",
      agreementUrl:
        "Agreement is being processed. You will receive it via email shortly.",
    });
  } catch (error) {
    console.error("Error queueing agreement generation:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to generate agreement",
      error: error.message,
    });
  }
};

const addVendorAgreement = async (req, res) => {
  try {
    const { serviceType, vendorId, agreementUrl } = req.body;

    console.log(
      `Updating service model for ${serviceType} with vendorId: ${vendorId}`
    );
    console.log(`Agreement URL: ${agreementUrl}`);

    const { ReduxCatererModel } = await import(
      "../models2/reduxModels/caterer.js"
    );
    const { ReduxDecoratorModel } = await import(
      "../models2/reduxModels/decorator.js"
    );
    const { ReduxDJModel } = await import("../models2/reduxModels/dj.js");
    const { ReduxMakeupArtistModel  } = await import("../models2/reduxModels/makeupArtist.js");
    const { ReduxPhotographerVideographerModel } = await import(
      "../models2/reduxModels/photographerVideographer.js"
    );
    const { ReduxVenueProviderModel } = await import(
      "../models2/reduxModels/venueProvider.js"
    );
    const { Caterer } = await import("../models2/caterer.js");
    const { Decorator } = await import("../models2/decorator.js");
    const MakeupArtist = (await import("../models2/makeupArtist.js")).default;
    const Photographer = (
      await import("../models2/photographerVideographer.js")
    ).default;
    const { Venue } = await import("../models2/venueProvider.js");

    const updateData = {
      agreement_url: agreementUrl,
      agreement_signed_at: new Date(),
    };

    switch (serviceType.toLowerCase()) {
      case "caterer":
        console.log("Processing caterer case...");

        const tempCateringUpdate = await ReduxCatererModel.findOneAndUpdate(
          { vendor_id: vendorId },
          { $set: updateData },
          { new: true, upsert: false }
        );

        if (!tempCateringUpdate) {
          console.log("Creating new temporary catering data...");
          const newTempData = new ReduxCatererModel({
            vendor_id: vendorId,
            ...updateData,
            pageNumber: 8,
          });
          await newTempData.save();
        }

        try {
          await Caterer.updateMany(
            { vendor_id: vendorId },
            {
              $set: {
                agreement_url: agreementUrl,
                agreement_signed_at: new Date(),
              },
            }
          );
        } catch (mainCatererError) {
          console.warn(
            "Error updating main caterer model (expected during onboarding):",
            mainCatererError.message
          );
        }
        break;

      case "decorator":
        console.log("Processing decorator case...");

        const tempDecoratorUpdate = await ReduxDecoratorModel.findOneAndUpdate(
          { vendor_id: vendorId },
          { $set: updateData },
          { new: true, upsert: false }
        );
        if (!tempDecoratorUpdate) {
          const newTempDecorator = new ReduxDecoratorModel({
            vendor_id: vendorId,
            ...updateData,
            pageNumber: 8,
          });
          await newTempDecorator.save();
        }

        try {
          await Decorator.updateOne(
            { vendor_id: vendorId },
            {
              $set: {
                agreement_url: agreementUrl,
                agreement_signed_at: new Date(),
              },
            }
          );
        } catch (mainDecoratorError) {
          console.warn(
            "Error updating main decorator model (expected during onboarding):",
            mainDecoratorError.message
          );
        }
        break;

      case "makeup":
      case "makeupartist":
        console.log("Processing makeup artist case...");

        const tempMakeupUpdate = await ReduxMakeupArtistModel.findOneAndUpdate(
          { vendor_id: vendorId },
          { $set: updateData },
          { new: true, upsert: false }
        );

        if (!tempMakeupUpdate) {
          const newTempMakeup = new ReduxMakeupArtistModel({
            vendor_id: vendorId,
            ...updateData,
            pageNumber: 8,
          });
          await newTempMakeup.save();
        }

        try {
          await MakeupArtist.updateOne(
            { vendor_id: vendorId },
            {
              $set: {
                agreement_url: agreementUrl,
                agreement_signed_at: new Date(),
              },
            }
          );
        } catch (mainMakeupError) {
          console.warn(
            "Error updating main makeup artist model (expected during onboarding):",
            mainMakeupError.message
          );
        }
        break;

      case "photographer":
      case "videographer":
      case "pav":
      case "photographervideographer":
        console.log("Processing photographer/videographer case...");

        const tempPAVUpdate =
          await ReduxPhotographerVideographerModel.findOneAndUpdate(
            { vendor_id: vendorId },
            { $set: updateData },
            { new: true, upsert: false }
          );

        if (!tempPAVUpdate) {
          const newTempPAV = new ReduxPhotographerVideographerModel({
            vendor_id: vendorId,
            ...updateData,
            pageNumber: 8,
          });
          await newTempPAV.save();
        }

        try {
          await Photographer.updateOne(
            { vendor_id: vendorId },
            {
              $set: {
                agreement_url: agreementUrl,
                agreement_signed_at: new Date(),
              },
            }
          );
        } catch (mainPAVError) {
          console.warn(
            "Error updating main photographer model (expected during onboarding):",
            mainPAVError.message
          );
        }
        break;

      case "dj":
      case "djartist":
      case "dj-artist":
        const tempDJUpdate = await ReduxDJModel.findOneAndUpdate(
          { vendor_id: vendorId },
          { $set: updateData },
          { new: true, upsert: false }
        );
        if (!tempDJUpdate) {
          const newTempDJ = new ReduxDJModel({
            vendor_id: vendorId,
            ...updateData,
            pageNumber: 8,
          });
          await newTempDJ.save();
        }

        try {
          await DJArtist.updateOne(
            { vendor_id: vendorId },
            {
              $set: {
                agreement_url: agreementUrl,
                agreement_signed_at: new Date(),
              },
            }
          );
        } catch (mainDJError) {
          console.warn(
            "Error updating main DJ artist model (expected during onboarding):",
            mainDJError.message
          );
        }
        break;

      case "venue":
      case "venue-provider":
        console.log("Processing venue case...");

        const tempVenueUpdate = await ReduxVenueProviderModel.findOneAndUpdate(
          { vendor_id: vendorId },
          { $set: updateData },
          { new: true, upsert: false }
        );

        if (!tempVenueUpdate) {
          const newTempVenue = new ReduxVenueProviderModel({
            vendor_id: vendorId,
            ...updateData,
            pageNumber: 8,
          });
          await newTempVenue.save();
        }

        try {
          await Venue.updateOne(
            { vendor_id: vendorId },
            {
              $set: {
                agreement_url: agreementUrl,
                agreement_signed_at: new Date(),
              },
            }
          );
        } catch (mainVenueError) {
          console.warn(
            "Error updating main venue model (expected during onboarding):",
            mainVenueError.message
          );
        }
        break;

      default:
        console.warn(
          `Service type ${serviceType} not supported for agreement storage`
        );
    }

    res.json({
      success: true,
      message: "Agreement URL updated successfully",
    });
  } catch (error) {
    console.error("Error updating agreement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update agreement",
      error: error.message,
    });
  }
};

export { generateAndStoreAgreement, addVendorAgreement };
