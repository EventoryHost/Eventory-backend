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
import chromium from "@sparticuz/chromium";

dotenv.config();

// Helper function to generate HTML from React component
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Agreement - ${vendorData.fullName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h2 {
            color: #2E3192;
            margin-bottom: 10px;
            font-size: 24px;
            font-weight: bold;
        }
        .content {
            margin-bottom: 20px;
        }
        .underline {
            text-decoration: underline;
        }
        ul {
            margin-left: 20px;
        }
        table {
            width: 100%;
            margin: 16px 0;
            border-collapse: collapse;
        }
        th, td {
            padding: 8px 16px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
        }
        th {
            background-color: #f3f4f6;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .signature-section {
            margin-top: 20px;
        }
        .signature-section div {
            margin-bottom: 20px;
        }
        strong {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Vendor Agreement</h2>
    </div>

    <div class="content">
        <p>
            This Vendor Agreement ("<strong>Agreement</strong>") is entered into as of
            <strong>${currentDate}</strong> between:
        </p>
        <br />
        <p>
            <strong>Eventory Tech Solutions Pvt. Ltd.</strong> ("<strong>Platform</strong>" or "<strong>Company</strong>"),<br />
            having its principal place of business at:<br />
            <strong>13-D, Atmaram House, 1-Tolstoy Marg, Connaught Place, New Delhi-110001</strong><br />
            and <br />
            <strong>${vendorData?.fullName || "Vendor Name"}</strong> <br />
            having its principal place of business at: <br />
            <strong>${vendorData?.address || "Vendor Address"}</strong>.
        </p>
        <p>
            Collectively referred to as the "<strong>Parties</strong>" and individually as a "<strong>Party</strong>."
        </p>
        <br />
        
        <p><strong class="underline">1. Definitions</strong></p>
        <ul>
            <li><strong>1.1 Platform:</strong> Eventory's online and offline event booking platform where services are offered to users.</li>
            <li><strong>1.2 Vendor:</strong> The entity providing goods or services for events listed on the Platform.</li>
            <li><strong>1.3 Users/Clients:</strong> Individuals or businesses that hire the Vendor via the Platform.</li>
            <li><strong>1.4 Services:</strong> The services provided by the Vendor listed on the Platform (e.g., catering, photography, event planning, etc.).</li>
            <li><strong>1.5 Booking Amount:</strong> The base price of the goods or services offered by the Vendor (inclusive of applicable taxes).</li>
        </ul>
        <br />
        
        <p><strong class="underline">2. Scope of Services</strong></p>
        <ul>
            <li>
                <strong>2.1 Description of Services:</strong> The Vendor agrees to provide the following services as a:
                <strong>
                    ${
                      vendorData?.category === "pav"
                        ? "PHOTOGRAPHERS AND VIDEOGRAPHERS"
                        : (vendorData?.category || "Service Type").toUpperCase()
                    }
                </strong>.
            </li>
            <li>
                <strong>2.2 Service Standards:</strong> The Vendor agrees to deliver services in a professional manner, adhering to industry standards, and will comply with all legal and regulatory requirements.
            </li>
        </ul>
        <br />
        
        <p><strong class="underline">3. Term and Termination</strong></p>
        <ul>
            <li>
                <strong>3.1 Agreement Term:</strong> This Agreement is effective as of
                <strong>${currentDate}</strong> and shall remain in effect until terminated by either Party as provided in this section.
            </li>
            <li>
                <strong>3.2 Termination by Vendor:</strong> The Vendor may terminate this Agreement by providing a written notice to the platform within the 7 days of registration, i.e
                <strong>${sevenDaysFromNow}</strong>
            </li>
            <li>
                <strong>3.3 Termination by Platform:</strong> The Platform may terminate this Agreement immediately if the Vendor breaches any terms of this Agreement or fails to provide services up to required standards.
            </li>
            <li>
                <strong>3.4 Effect of Termination:</strong> Upon termination, all pending transactions or bookings will be completed unless mutually agreed otherwise. The Vendor shall be responsible for all commitments made prior to the date of termination.
            </li>
        </ul>
        <br />
        
        <p><strong class="underline">4. Payment and Commission</strong></p>
        <ul>
            <li>
                <strong>4.1 Commission Structure:</strong> The Platform will retain commission based on the total transaction amount as follows:
                <br />
                <div style="margin-top: 16px; margin-bottom: 16px;">
                    <strong style="font-size: 16px; padding-top: 16px;">Commission Rate Table</strong>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Amount Range</th>
                            <th>Commission Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${commissionData
                          .map(
                            (item) => `
                            <tr>
                                <td>${item.range}</td>
                                <td>${item.rate}%</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </li>
            <li>
                <strong>4.2 Payment Schedule:</strong> Payments to the Vendor will be made either within 24 hours of the completion of the event or on the day of the event after the deduction of the Eventory's commission charges as per the commission table given in 4.1
            </li>
        </ul>
        <br />
        
        <p><strong class="underline">5. Vendor Obligations</strong></p>
        <ul>
            <li><strong>5.1 Compliance with Laws:</strong> The Vendor agrees to comply with all applicable local, state, and national laws and regulations.</li>
            <li><strong>5.2 Licenses and Permits:</strong> The Vendor is solely responsible for obtaining and maintaining any licenses, permits, and certifications required to perform the agreed-upon services.</li>
            <li><strong>5.3 Insurance:</strong> The Vendor shall maintain sufficient liability insurance to cover risks associated with the provision of services under this Agreement. Proof of insurance must be provided upon request.</li>
            <li><strong>5.4 Service Delivery:</strong> The Vendor guarantees timely delivery of services as per agreed-upon schedules, and any failure to deliver shall be considered a breach of this Agreement.</li>
        </ul>
        <br />
        
        <p><strong class="underline">6. Cancellation, Refund, and Booking Guarantee Policy</strong></p>
        <ul>
            <li>
                <strong>6.1 Vendor Cancellation:</strong> When a Vendor cancels a booking, Eventory will charge a cancellation fee as a percentage of the booking amount based on how far in advance the cancellation occurs, as outlined in the cancellation table below:
                <br />
                <div style="margin-top: 16px; margin-bottom: 16px;">
                    <strong style="font-size: 16px;">Vendor Cancellation Fee Table</strong>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Timeline</th>
                            <th>Cancellation Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vendorCancellationData
                          .map(
                            (item) => `
                            <tr>
                                <td>${item.timeline}</td>
                                <td>${item.fee}%</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </li>
            <li>
                <strong>6.2 Customer Cancellation:</strong> If a customer cancels a booking, they will be charged a percentage of the BOOKING AMOUNT as per the customer cancellation table below, and that amount will be transferred to the Vendor.
                <br />
                <div style="margin-top: 16px; margin-bottom: 16px;">
                    <strong style="font-size: 16px;">Customer Cancellation Fee Table</strong>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Timeline</th>
                            <th>Cancellation Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customerCancellationData
                          .map(
                            (item) => `
                            <tr>
                                <td>${item.timeline}</td>
                                <td>${item.fee}%</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </li>
        </ul>
        <br />
        
        <p><strong class="underline">7. Vendor's Representation and Warranties</strong></p>
        <ul>
            <li><strong>7.1 Performance:</strong> The Vendor warrants that it has the necessary skills, experience, and resources to perform the services professionally and efficiently.</li>
            <li><strong>7.2 Non-Infringement:</strong> The Vendor warrants that all services provided do not infringe on any third-party intellectual property rights.</li>
            <li><strong>7.3 Compliance:</strong> The Vendor represents that it complies with all laws and regulations related to the performance of its services.</li>
        </ul>
        <br />
        
        <p><strong class="underline">8. Vendor Visibility, Booking Numbers, and ROI</strong></p>
        <ul>
            <li><strong>8.1 Visibility and Marketing:</strong> The Vendor's visibility on the Platform depends on factors such as quality of service, pricing competitiveness, and profile updates.</li>
            <li><strong>8.2 No Guarantee of Bookings:</strong> The Platform does not guarantee a fixed number of bookings or orders to any Vendor. Success depends on several factors such as customer preferences and service quality.</li>
        </ul>
        <br />
        
        <p><strong class="underline">9. Dispute Resolution</strong></p>
        <ul>
            <li><strong>9.1 Disputes with Users:</strong> The Platform will act as an intermediary in any disputes between the Vendor and the user.</li>
            <li><strong>9.2 Arbitration:</strong> Any disputes between the Vendor and Platform shall be settled by arbitration in accordance with the rules of [Arbitration Body].</li>
        </ul>
        <br />
        
        <p><strong class="underline">10. Governing Law</strong></p>
        <p>This Agreement shall be governed by and construed in accordance with the laws of India.</p>
        <br />
        
        <p><strong class="underline">11. Miscellaneous</strong></p>
        <ul>
            <li><strong>11.1 Amendments:</strong> This Agreement may only be amended in writing signed by both Parties.</li>
            <li><strong>11.2 Entire Agreement:</strong> This Agreement constitutes the entire agreement between the Parties regarding its subject matter and supersedes any prior agreements.</li>
            <li><strong>11.3 Entire Agreement:</strong> This Agreement constitutes the entire agreement between the Parties and supersedes all prior agreements and understandings.</li>
        </ul>
        <br />
        
        <p><strong style="margin-top: 30px;">IN WITNESS WHEREOF</strong></p>
        <p><strong>The Parties have executed this Agreement as of the date written below:</strong></p>
        <br />
        
        <div class="signature-section">
            <div>
                <p><strong>For Eventory:</strong></p>
                <p><strong>Signature:</strong> Eventory</p>
                <p><strong>Name:</strong> Eventory Tech Solutions Pvt. Ltd.</p>
                <p><strong>Date:</strong> ${currentDate}</p>
            </div>
            
            <div>
                <p><strong>For Vendor:</strong></p>
                <p><strong>Signature:</strong> ${signature}</p>
                <p><strong>Date:</strong> ${currentDate}</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
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

    console.log("Importing puppeteer...");
    // Dynamic import puppeteer
    const puppeteer = process.env.IS_LOCAL === "true"
      ? await import("puppeteer")
      : await import("puppeteer-core");
    console.log("Puppeteer imported successfully");

    console.log("Launching browser...");
    // Launch Puppeteer
    browser = process.env.IS_LOCAL === "true"
      ? await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      : await puppeteer.default.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        });
    console.log("Browser launched successfully");

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
