import puppeteer from "puppeteer-core";
import { readFileSync } from "fs";
import path from "path";
import { uploadInvoiceToS3 } from "../controllers/s3Controller.js";
import { Vendor } from "../models/users.js";
import chromium from "@sparticuz/chromium";

async function generateInvoice(customer, paymentDetails) {
  try {
    const templatePath = path.resolve("templates", "invoiceTemplate.html");
    let html = readFileSync(templatePath, "utf8");

    // Replace placeholders with actual data
    html = html.replace("{{invoiceNumber}}", paymentDetails.invoiceNumber);
    html = html.replace("{{invoiceDate}}", paymentDetails.invoiceDate);
    html = html.replace("{{dueDate}}", paymentDetails.dueDate || "N/A");
    html = html.replace("{{paymentMethod}}", paymentDetails.method);
    html = html.replace("{{customerName}}", customer.name);
    html = html.replace(
      "{{customerBusinessName}}",
      customer.businessDetails.businessName,
    );
    html = html.replace(
      "{{customerAddress}}",
      customer.businessDetails.businessAddress,
    );
    html = html.replace("{{amount}}", paymentDetails.amount);

    // Launch Puppeteer and create PDF
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    // Define PDF options
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    const invoiceUrl = await uploadInvoiceToS3(
      pdfBuffer,
      `vendors/${customer.id}/invoice-${paymentDetails.invoiceNumber}.pdf`,
    );
    console.log("Invoice uploaded to S3:", invoiceUrl);
    const vendor = await Vendor.findOne({ id: customer.id });
    vendor.invoices.push(invoiceUrl);
    await vendor.save();

    console.log("Invoice URL saved to MongoDB");
    const result = {
      fileName: `invoice-${paymentDetails.invoiceNumber}.pdf`,
      pdf: pdfBuffer,
      url: invoiceUrl,
    };
    return result;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
}

export default generateInvoice;
