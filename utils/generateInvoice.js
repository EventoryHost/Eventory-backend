import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import path from "path";
import { uploadInvoiceToS3 } from "../controllers/s3Controller.js";
import { Vendor } from "../models/users.js";

async function generateInvoice(customer, paymentDetails) {
  try {
    const templatePath = path.join("templates", "invoiceTemplate.html");
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
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    // Define PDF options
    const pdfOptions = {
      path: path.join("./", `invoice-${paymentDetails.invoiceNumber}.pdf`),
      format: "A4",
      printBackground: true,
    };
    await page.pdf(pdfOptions);

    await browser.close();

    console.log(`Invoice generated at: ${pdfOptions.path}`);
    const invoiceUrl = await uploadInvoiceToS3(
      pdfOptions.path,
      `vendors/${customer.id}/invoice-${paymentDetails.invoiceNumber}.pdf`,
    );
    console.log("Invoice uploaded to S3:", invoiceUrl);
    const vendor = await Vendor.findOne({ id: customer.id });
    vendor.invoices.push(invoiceUrl);
    await vendor.save();

    console.log("Invoice URL saved to MongoDB");
    const result = {
      path: pdfOptions.path,
      url: invoiceUrl,
    };
    return result;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
}

export default generateInvoice;
