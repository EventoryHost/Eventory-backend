import dotenv from "dotenv";
import { uploadAgreementToS3 } from "./s3Controller.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import { CateringModel } from "../models/reduxStores/catering.js";
import { DecoratorModel } from "../models/reduxStores/decorator.js";
import MakeupArtistModel from "../models/reduxStores/makeUpArtist.js";
import PAVModel from "../models/reduxStores/pav.js";
import VenueModel from "../models/reduxStores/venue-provider.js";
import MakeupArtist from "../models/makeupArtists.js";
import Photographer from "../models/photographers.js";
import { Venue } from "../models/venue.js";
import { chromium } from "playwright";
import { readFileSync } from "fs";
import path from "path";

dotenv.config();

// Helper function to generate HTML from template
const generateAgreementHTML = (agreementData) => {
  const {
    vendorData,
    serviceType,
    commissionData,
    vendorCancellationData,
    customerCancellationData,
    signature,
  } = agreementData;

  const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const currentDate = formatDateDDMMYYYY(new Date());
  const sevenDaysFromNow = formatDateDDMMYYYY(
    new Date(new Date().setDate(new Date().getDate() + 7))
  );

  try {
    // Read template file
    const templatePath = path.resolve("templates", "agreementTemplate.html");
    let html = readFileSync(templatePath, "utf8");

    // Generate commission table rows
    const commissionTableRows = commissionData
      .map(
        (item) => `
        <tr>
            <td>${item.range}</td>
            <td>${item.rate}%</td>
        </tr>
    `
      )
      .join("");

    // Generate vendor cancellation table rows
    const vendorCancellationTableRows = vendorCancellationData
      .map(
        (item) => `
        <tr>
            <td>${item.timeline}</td>
            <td>${item.fee}%</td>
        </tr>
    `
      )
      .join("");

    // Generate customer cancellation table rows
    const customerCancellationTableRows = customerCancellationData
      .map(
        (item) => `
        <tr>
            <td>${item.timeline}</td>
            <td>${item.fee}%</td>
        </tr>
    `
      )
      .join("");

    // Format the vendor service type display name
    const vendorServiceTypeFormatted = 
      vendorData?.category === "pav" 
        ? "PHOTOGRAPHERS AND VIDEOGRAPHERS" 
        : (vendorData?.category || serviceType || "Service Type").toUpperCase();

    // Replace placeholders in the template
    html = html.replace(/{{vendorName}}/g, vendorData?.fullName || "Vendor");
    html = html.replace(/{{currentDate}}/g, currentDate);
    html = html.replace(/{{sevenDaysFromNow}}/g, sevenDaysFromNow);
    html = html.replace(/{{vendorFullName}}/g, vendorData?.fullName || "Vendor Name");
    html = html.replace(/{{vendorAddress}}/g, vendorData?.address || "Vendor Address");
    html = html.replace(/{{vendorServiceType}}/g, vendorServiceTypeFormatted);
    html = html.replace(/{{commissionTableRows}}/g, commissionTableRows);
    html = html.replace(/{{vendorCancellationTableRows}}/g, vendorCancellationTableRows);
    html = html.replace(/{{customerCancellationTableRows}}/g, customerCancellationTableRows);
    html = html.replace(/{{signature}}/g, signature);

    return html;
  } catch (error) {
    console.error("Error generating agreement HTML from template:", error);
    throw error;
  }
};

// Main function to generate agreement PDF
async function generateAgreementPDF(serviceType, vendorId, agreementData) {
  let browser = null;
  let page = null;

  try {
    console.log("Generating HTML content...");
    // Generate HTML content
    const html = generateAgreementHTML(agreementData);
    console.log("HTML generated, length:", html.length);

    console.log("Launching browser with Playwright...");
    // Launch Playwright browser
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("Creating new page...");
    page = await browser.newPage();

    console.log("Setting content...");
    await page.setContent(html, {
      waitUntil: "load",
    });

    console.log("Generating PDF...");
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });
    console.log("PDF generated, buffer size:", pdfBuffer.length);

    // Close browser
    if (page && !page.isClosed()) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    console.log("Browser closed");

    console.log("Uploading to S3...");
    // Upload to S3
    const agreementUrl = await uploadAgreementToS3(
      pdfBuffer,
      serviceType,
      vendorId
    );

    console.log("Agreement uploaded to S3:", agreementUrl);

    return {
      success: true,
      agreementUrl: agreementUrl,
      pdfBuffer: pdfBuffer,
    };
  } catch (error) {
    console.error("Error generating agreement PDF:", error);
    console.error("Error stack:", error.stack);
    
    // Cleanup
    try {
      if (page && !page.isClosed()) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
    
    throw error;
  }
}

// Function to update service model with agreement URL
async function updateServiceModelWithAgreement(serviceType, vendorId, agreementUrl) {
  try {
    console.log(`Updating service model for ${serviceType} with vendorId: ${vendorId}`);
    console.log(`Agreement URL: ${agreementUrl}`);
    
    switch (serviceType.toLowerCase()) {
      case "caterer":
        console.log("Processing caterer case...");
        
        // Update the temporary catering data (ReduxCatering collection)
        const tempCateringUpdate = await CateringModel.findOneAndUpdate(
          { id: vendorId },
          {
            $set: {
              agreementUrl: agreementUrl,
              agreementSignedAt: new Date()
            }
          },
          { new: true, upsert: false }
        );
        
        if (!tempCateringUpdate) {
          console.log("Temporary catering data not found, trying to find existing document...");
          const existingTempData = await CateringModel.findOne({ id: vendorId });
          if (existingTempData) {
            console.log("Found existing temp data, updating directly...");
            existingTempData.agreementUrl = agreementUrl;
            existingTempData.agreementSignedAt = new Date();
            await existingTempData.save();
            console.log("Temporary catering data updated successfully");
          } else {
            console.log("No temporary catering data found for vendor:", vendorId);
            // Create a minimal entry if it doesn't exist
            const newTempData = new CateringModel({
              id: vendorId,
              venId: vendorId,
              agreementUrl: agreementUrl,
              agreementSignedAt: new Date(),
              pageNumber: 8 // Set to agreement page
            });
            await newTempData.save();
            console.log("Created new temporary catering data with agreement");
          }
        } else {
          console.log("Temporary catering data updated successfully");
          console.log("Updated temp data agreement URL:", tempCateringUpdate.agreementUrl);
        }
        
        // Also try to update the main caterer model if it exists (for completed vendors)
        try {
          const existingCaterer = await Caterer.findOne({ venId: vendorId });
          if (existingCaterer) {
            console.log("Found existing caterer in main collection, updating...");
            
            const catererUpdate = await Caterer.updateOne(
              { venId: vendorId },
              {
                $set: {
                  "policies.agreementUrl": agreementUrl,
                  "policies.agreementSignedAt": new Date()
                }
              }
            );
            
            console.log("Main caterer update result:", catererUpdate);
            
            if (catererUpdate.modifiedCount > 0) {
              console.log("Main caterer model updated successfully");
            }
          } else {
            console.log("No existing caterer found in main collection (normal for onboarding process)");
          }
        } catch (mainCatererError) {
          console.warn("Error updating main caterer model (this is expected during onboarding):", mainCatererError.message);
        }
        
        break;

      case "decorator":
        console.log("Processing decorator case...");
        
        // Update the temporary decorator data
        const tempDecoratorUpdate = await DecoratorModel.findOneAndUpdate(
          { id: vendorId },
          {
            $set: {
              agreementUrl: agreementUrl,
              agreementSignedAt: new Date()
            }
          },
          { new: true, upsert: false }
        );
        
        if (!tempDecoratorUpdate) {
          console.log("Temporary decorator data not found, creating new entry...");
          const newTempDecorator = new DecoratorModel({
            id: vendorId,
            agreementUrl: agreementUrl,
            agreementSignedAt: new Date(),
            pageNumber: 8 // Set to agreement page
          });
          await newTempDecorator.save();
          console.log("Created new temporary decorator data with agreement");
        } else {
          console.log("Temporary decorator data updated successfully");
        }
        
        // Try to update main decorator model if it exists
        try {
          const decoratorUpdate = await Decorator.updateOne(
            { venId: vendorId },
            {
              $set: {
                "policies.agreementUrl": agreementUrl,
                "policies.agreementSignedAt": new Date()
              }
            }
          );
          
          if (decoratorUpdate.modifiedCount > 0) {
            console.log("Main decorator model updated successfully");
          }
        } catch (mainDecoratorError) {
          console.warn("Error updating main decorator model (expected during onboarding):", mainDecoratorError.message);
        }
        
        break;

      case "makeup":
      case "makeupartist":
      case "makeupArtist":
        console.log("Processing makeup artist case...");
        
        // Update the temporary makeup artist data
        const tempMakeupUpdate = await MakeupArtistModel.findOneAndUpdate(
          { id: vendorId },
          {
            $set: {
              agreementUrl: agreementUrl,
              agreementSignedAt: new Date()
            }
          },
          { new: true, upsert: false }
        );
        
        if (!tempMakeupUpdate) {
          console.log("Temporary makeup artist data not found, creating new entry...");
          const newTempMakeup = new MakeupArtistModel({
            id: vendorId,
            agreementUrl: agreementUrl,
            agreementSignedAt: new Date(),
            pageNumber: 8 // Set to agreement page
          });
          await newTempMakeup.save();
          console.log("Created new temporary makeup artist data with agreement");
        } else {
          console.log("Temporary makeup artist data updated successfully");
        }
        
        // Try to update main makeup artist model if it exists
        try {
          const makeupUpdate = await MakeupArtist.updateOne(
            { venId: vendorId },
            {
              $set: {
                "policies.agreementUrl": agreementUrl,
                "policies.agreementSignedAt": new Date()
              }
            }
          );
          
          if (makeupUpdate.modifiedCount > 0) {
            console.log("Main makeup artist model updated successfully");
          }
        } catch (mainMakeupError) {
          console.warn("Error updating main makeup artist model (expected during onboarding):", mainMakeupError.message);
        }
        
        break;

      case "photographer":
      case "videographer":
      case "pav":
        console.log("Processing photographer/videographer case...");
        
        // Update the temporary PAV data
        const tempPAVUpdate = await PAVModel.findOneAndUpdate(
          { id: vendorId },
          {
            $set: {
              agreementUrl: agreementUrl,
              agreementSignedAt: new Date()
            }
          },
          { new: true, upsert: false }
        );
        
        if (!tempPAVUpdate) {
          console.log("Temporary PAV data not found, creating new entry...");
          const newTempPAV = new PAVModel({
            id: vendorId,
            agreementUrl: agreementUrl,
            agreementSignedAt: new Date(),
            pageNumber: 8 // Set to agreement page
          });
          await newTempPAV.save();
          console.log("Created new temporary PAV data with agreement");
        } else {
          console.log("Temporary PAV data updated successfully");
        }
        
        // Try to update main photographer model if it exists
        try {
          const pavUpdate = await Photographer.updateOne(
            { venId: vendorId },
            {
              $set: {
                "policies.agreementUrl": agreementUrl,
                "policies.agreementSignedAt": new Date()
              }
            }
          );
          
          if (pavUpdate.modifiedCount > 0) {
            console.log("Main photographer model updated successfully");
          }
        } catch (mainPAVError) {
          console.warn("Error updating main photographer model (expected during onboarding):", mainPAVError.message);
        }
        
        break;

      case "venue":
      case "venue-provider":
        console.log("Processing venue case...");
        
        // Update the temporary venue data
        const tempVenueUpdate = await VenueModel.findOneAndUpdate(
          { id: vendorId },
          {
            $set: {
              agreementUrl: agreementUrl,
              agreementSignedAt: new Date()
            }
          },
          { new: true, upsert: false }
        );
        
        if (!tempVenueUpdate) {
          console.log("Temporary venue data not found, creating new entry...");
          const newTempVenue = new VenueModel({
            id: vendorId,
            agreementUrl: agreementUrl,
            agreementSignedAt: new Date(),
            pageNumber: 8 // Set to agreement page
          });
          await newTempVenue.save();
          console.log("Created new temporary venue data with agreement");
        } else {
          console.log("Temporary venue data updated successfully");
        }
        
        // Try to update main venue model if it exists
        try {
          const venueUpdate = await Venue.updateOne(
            { venId: vendorId },
            {
              $set: {
                "policies.agreementUrl": agreementUrl,
                "policies.agreementSignedAt": new Date()
              }
            }
          );
          
          if (venueUpdate.modifiedCount > 0) {
            console.log("Main venue model updated successfully");
          }
        } catch (mainVenueError) {
          console.warn("Error updating main venue model (expected during onboarding):", mainVenueError.message);
        }
        
        break;
        
      default:
        console.warn(`Service type ${serviceType} not supported for agreement storage`);
    }
  } catch (error) {
    console.error("Error updating service model:", error);
    throw error;
  }
}

// Main controller function
const generateAndStoreAgreement = async (req, res) => {
  try {
    const { serviceType, vendorId } = req.params;
    const agreementData = req.body;

    console.log("Received request:", { serviceType, vendorId });
    console.log("Agreement data keys:", Object.keys(agreementData));

    // Validate input
    if (!serviceType || !vendorId) {
      console.error("Missing serviceType or vendorId");
      return res.status(400).json({
        success: false,
        message: "Service type and vendor ID are required",
      });
    }

    if (!agreementData || !agreementData.vendorData || !agreementData.signature) {
      console.error("Missing agreement data or signature");
      return res.status(400).json({
        success: false,
        message: "Agreement data and signature are required",
      });
    }

    console.log("Starting PDF generation...");
    // Generate PDF
    const result = await generateAgreementPDF(serviceType, vendorId, agreementData);
    console.log("PDF generated successfully");

    console.log("Updating service model...");
    // Update service model
    await updateServiceModelWithAgreement(serviceType, vendorId, result.agreementUrl);
    console.log("Service model updated successfully");

    // Let's verify the update by fetching the record again
    switch (serviceType.toLowerCase()) {
      case "caterer":
        const verifyTempUpdate = await CateringModel.findOne({ id: vendorId });
        console.log("Verification - Agreement URL in temp data:", verifyTempUpdate?.agreementUrl);
        console.log("Verification - Agreement signed at temp data:", verifyTempUpdate?.agreementSignedAt);
        
        // Also check main collection if it exists
        const verifyMainUpdate = await Caterer.findOne({ venId: vendorId });
        if (verifyMainUpdate) {
          console.log("Verification - Agreement URL in main DB:", verifyMainUpdate?.policies?.agreementUrl);
          console.log("Verification - Agreement signed at main DB:", verifyMainUpdate?.policies?.agreementSignedAt);
        }
        break;

      case "decorator":
        const verifyTempDecoratorUpdate = await DecoratorModel.findOne({ id: vendorId });
        console.log("Verification - Decorator agreement URL in temp data:", verifyTempDecoratorUpdate?.agreementUrl);
        console.log("Verification - Decorator agreement signed at temp data:", verifyTempDecoratorUpdate?.agreementSignedAt);
        break;

      case "makeup":
      case "makeupartist":
        const verifyTempMakeupUpdate = await MakeupArtistModel.findOne({ id: vendorId });
        console.log("Verification - Makeup artist agreement URL in temp data:", verifyTempMakeupUpdate?.agreementUrl);
        console.log("Verification - Makeup artist agreement signed at temp data:", verifyTempMakeupUpdate?.agreementSignedAt);
        break;

      case "photographer":
      case "videographer":
      case "pav":
        const verifyTempPAVUpdate = await PAVModel.findOne({ id: vendorId });
        console.log("Verification - PAV agreement URL in temp data:", verifyTempPAVUpdate?.agreementUrl);
        console.log("Verification - PAV agreement signed at temp data:", verifyTempPAVUpdate?.agreementSignedAt);
        break;

      case "venue":
        const verifyTempVenueUpdate = await VenueModel.findOne({ id: vendorId });
        console.log("Verification - Venue agreement URL in temp data:", verifyTempVenueUpdate?.agreementUrl);
        console.log("Verification - Venue agreement signed at temp data:", verifyTempVenueUpdate?.agreementSignedAt);
        break;
    }

    res.json({
      success: true,
      message: "Agreement generated and stored successfully",
      agreementUrl: result.agreementUrl,
    });
  } catch (error) {
    console.error("Error in generateAndStoreAgreement:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to generate agreement",
      error: error.message,
    });
  }
};

export { generateAndStoreAgreement };
