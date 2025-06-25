import dotenv from "dotenv";

dotenv.config();

import { readFileSync } from "fs";
import path from "path";
import { uploadInvoiceToS3 } from "../controllers/s3Controller.js";
import { Vendor } from "../models/users.js";
import chromium from "@sparticuz/chromium";

const puppeteer =
  process.env.IS_LOCAL === "true"
    ? await import("puppeteer")
    : await import("puppeteer-core");

async function generateInvoice(customer, paymentDetails) {

  console.log(paymentDetails);
  try {
    const templatePath = path.resolve("templates", "invoiceTemplate.html");
    let html = readFileSync(templatePath, "utf8");
    let css = readFileSync(path.resolve("templates", "style.css"), "utf8");

    const subtotal = paymentDetails.amount * 0.82;
    const tax = paymentDetails.amount * 0.18;
    let taxSection = "";
    console.log("Customer:", customer.businessDetails);
    if (customer.businessDetails.pinCode.toString().startsWith("1")) {
      // CGST & SGST for Delhi-based pincodes
      const cgst = tax / 2;
      const sgst = tax / 2;
      taxSection = `<p>Subtotal: ₹ ${subtotal.toFixed(2)}</p>
        <p>CGST (9%): ₹ ${cgst.toFixed(2)}</p>
        <p>SGST (9%): ₹ ${sgst.toFixed(2)}</p>
        <h3>Total: ₹ ${paymentDetails.amount}</h3>

      `;
    } else {
      // IGST for other pincodes

      taxSection = `
      <p>Subtotal: ₹ ${subtotal.toFixed(2)}</p>

      <p>IGST (18%): ₹ ${tax.toFixed(2)}</p>
      <h3>Total: ₹ ${paymentDetails.amount}</h3>

      `;
    }

    // Replace placeholders with actual data

    html = html.replace("{{invoiceNumber}}", paymentDetails.invoiceNumber);
    html = html.replace("{{invoiceDate}}", paymentDetails.invoiceDate);
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
    html = html.replace("{{gstin}}", customer.businessDetails.gstin);
    html = html.replaceAll("{{subtotal}}", subtotal.toFixed(2));
    html = html.replace("{{taxSection}}", taxSection);
    html = html.replace("{{vendorId}}", customer.id);
    // Launch Puppeteer and create PDF


    const browser =
      process.env.IS_LOCAL === "true"
        ? await puppeteer.launch()
        : await puppeteer.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--memory-pressure-off',
            '--max_old_space_size=128',
            '--single-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,

        });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ['domcontentloaded'],
      timeout: 15000
    });
    await page.addStyleTag({ content: css });

    // Define PDF options
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, timeout: 15000 });

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

export async function sendInvoiceWithDiscount(
  customer,
  paymentDetails,
  discount,
) {
  const final_amt = +paymentDetails.amount - +discount;
  try {
    const templatePath = path.resolve(
      "templates",
      "invoiceWithDiscountTemplate.html",
    );
    let html = readFileSync(templatePath, "utf8");
    let css = readFileSync(path.resolve("templates", "style.css"), "utf8");

    const initial_total = paymentDetails.amount * 0.82;
    const subtotal = final_amt * 0.82;
    const tax = final_amt * 0.18;
    let taxSection = "";
    console.log("Customer:", customer.businessDetails);
    if (customer.businessDetails.pinCode.toString().startsWith("1")) {
      // CGST & SGST for Delhi-based pincodes
      const cgst = tax / 2;
      const sgst = tax / 2;
      taxSection = `<p>Subtotal: ₹ ${subtotal.toFixed(2)}</p>
        <p>CGST (9%): ₹ ${cgst.toFixed(2)}</p>
        <p>SGST (9%): ₹ ${sgst.toFixed(2)}</p>
        <h3>Total: ₹ ${final_amt}</h3>

      `;
    } else {
      // IGST for other pincodes

      taxSection = `
      <p>Subtotal: ₹ ${subtotal.toFixed(2)}</p>

      <p>IGST (18%): ₹ ${tax.toFixed(2)}</p>
      <h3>Total: ₹ ${final_amt}</h3>

      `;
    }

    // Replace placeholders with actual data

    html = html.replace("{{invoiceNumber}}", paymentDetails.invoiceNumber);
    html = html.replace("{{invoiceDate}}", paymentDetails.invoiceDate);
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
    html = html.replace("{{amount}}", final_amt);
    html = html.replace("{{gstin}}", customer.businessDetails.gstin);
    html = html.replaceAll("{{subtotal}}", initial_total.toFixed(2));
    html = html.replace("{{discount}}", (discount * 0.82).toFixed(2));
    html = html.replace("{{taxSection}}", taxSection);
    html = html.replace("{{vendorId}}", customer.id);
    // Launch Puppeteer and create PDF



    const browser =
      process.env.IS_LOCAL === "true"
        ? await puppeteer.launch()
        : await puppeteer.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--memory-pressure-off',
            '--max_old_space_size=128',
            '--single-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,

        });



    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ['domcontentloaded'],
      timeout: 15000
    });
    await page.addStyleTag({ content: css });

    // Define PDF options
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, timeout: 15000 });

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
