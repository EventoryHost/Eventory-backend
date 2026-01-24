import { chromium } from "playwright";
import { readFileSync } from "fs";
import path from "path";
import { uploadAgreementToS3 } from "./uploadToS3.js";
import axios from "axios";
import dotenv from "dotenv";

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
    const templatePath = path.resolve("templates", "agreementTemplate.html");     // Read template file
    let html = readFileSync(templatePath, "utf8");

    const commissionTableRows = commissionData
      .map(
        (item) => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.priceRange}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['25_plus_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['18_25_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['13_18_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['8_12_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['4_7_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['1_3_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['event_day']}%</td>
        </tr>
    `
      )
      .join("");

    const vendorCancellationTableRows = vendorCancellationData
      .map(
        (item) => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.priceRange}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['25_plus_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['18_25_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['13_18_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['8_12_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['4_7_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['1_3_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['event_day']}%</td>
        </tr>
    `
      )
      .join("");

    const customerCancellationTableRows = customerCancellationData
      .map(
        (item) => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.priceRange}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['25_plus_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['18_25_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['13_18_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['8_12_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['4_7_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['1_3_days']}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item['event_day']}%</td>
        </tr>
    `
      )
      .join("");

    const vendorServiceTypeFormatted = serviceType;

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
    console.log("Generating HTML content for agreement...");
    const html = generateAgreementHTML(agreementData);
    console.log("HTML generated, length:", html.length);

    console.log("Launching browser with Playwright...");
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

    if (page && !page.isClosed()) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    const agreementUrl = await uploadAgreementToS3(
      pdfBuffer,
      serviceType,
      vendorId
    );

    console.log("Agreement uploaded to S3:", agreementUrl);
    await axios.post(`${process.env.URL}/api/agreements/add-vendor-agreement`, {
      serviceType: serviceType,
      vendorId: vendorId,
      agreementUrl: agreementUrl,
    });

    return {
      success: true,
      agreementUrl: agreementUrl,
      pdfBuffer: pdfBuffer,
    };
  } catch (error) {
    console.error("Error generating agreement PDF:", error);
    console.error("Error stack:", error.stack);
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

// Main function to generate and store agreement
async function generateAndStoreAgreement(serviceType, vendorId, agreementData) {
  try {
    const result = await generateAgreementPDF(serviceType, vendorId, agreementData);
    await axios.post(
      `${process.env.URL}/api/agreements/add-vendor-agreement`,
      {
        serviceType: serviceType,
        vendorId: vendorId,
        agreementUrl: result.agreementUrl,
      }
    );
    console.log("Service model updated successfully via API");

    return result;
  } catch (error) {
    console.error("Error in generateAndStoreAgreement:", error);
    throw error;
  }
}
export { generateAndStoreAgreement };
