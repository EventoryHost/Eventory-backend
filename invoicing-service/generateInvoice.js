import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

import { readFileSync } from "fs";
import path from "path";
import { chromium } from "playwright";
import { sendInvoiceEmail } from "./sendtoEmail.js";
import { sendInvoiceToWhatsApp } from "./sendtoWA.js";
import { uploadToS3 } from "./uploadToS3.js";

async function generateVendorOnboardedInvoice(customer, paymentDetails) {
  let browser = null;
  let page = null;

  console.log(paymentDetails);
  try {
    const templatePath = path.resolve("templates", "invoiceTemplate.html");
    let html = readFileSync(templatePath, "utf8");
    let css = readFileSync(path.resolve("templates", "style.css"), "utf8");

    const subtotal = paymentDetails.amount * 0.82;
    const discount = parseInt(paymentDetails.discount).toFixed(2) || 0;
    console.log("discount", discount);
    const tax = (paymentDetails.amount - paymentDetails.discount) * 0.18;
    let taxSection = "";
    if (customer.businessDetails.pinCode.toString().startsWith("1")) {
      // CGST & SGST for Delhi-based pincodes
      const cgst = tax / 2;
      const sgst = tax / 2;
      taxSection = `<p>Subtotal: ₹ ${subtotal.toFixed(2)}</p>
      ${discount !== 0 ? `<p>Discount: -₹ ${discount * 0.82}</p>` : ""}
        <p>CGST (9%): ₹ ${cgst.toFixed(2)}</p>
        <p>SGST (9%): ₹ ${sgst.toFixed(2)}</p>
        <h3>Total: ₹ ${paymentDetails.amount}</h3>`;
    } else {
      // IGST for other pincodes
      taxSection = `
      <p>Subtotal: ₹ ${subtotal.toFixed(2)}</p>
      ${discount !== 0 ? `<p>Discount: -₹ ${discount * 0.82}</p>` : ""}
      <p>IGST (18%): ₹ ${tax.toFixed(2)}</p>
      <h3>Total: ₹ ${paymentDetails.amount}</h3>
      `;
    }

    if (discount !== 0) {
      html = html.replace("{{discountRow}}", `<tr>
      <td>₹ ${discount * 0.82}</td>
    </tr>`);
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

    if (paymentDetails.discount !== 0) html = html.replace("{{discount}}", paymentDetails.discount * 0.82);
    html = html.replace("{{gstin}}", customer.businessDetails.gstin);
    html = html.replaceAll("{{subtotal}}", subtotal.toFixed(2));
    html = html.replace("{{taxSection}}", taxSection);
    html = html.replace("{{vendorId}}", customer.id);

    // Launch Playwright and create PDF
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "load",
    });
    await page.addStyleTag({ content: css });

    // Define PDF options
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    if (page && !page.isClosed()) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }


    const invoiceUrl = await uploadToS3(
      pdfBuffer,
      `vendors/${customer.id}/invoice-${paymentDetails.invoiceNumber}.pdf`,
    );
    console.log("Invoice uploaded to S3:", invoiceUrl);

    await axios.post(
      `https://api.eventory.in/api/add-vendor-invoice`,
      {
        vendorId: customer.id,
        invoiceUrl,
      },
    );
    if (customer.email)
      await sendInvoiceEmail(
        customer.email,
        "Registration Successful!!!",
        "Thank you for registering with Eventory. Your invoice is attached.",
        pdfBuffer,
        `invoice-${paymentDetails.invoiceNumber}.pdf`
      )

    await sendInvoiceToWhatsApp(
      invoiceUrl,
      customer.mobile,
    )
    const result = {
      fileName: `invoice-${paymentDetails.invoiceNumber}.pdf`,
      pdf: pdfBuffer,
      url: invoiceUrl,
    };
    return result;
  } catch (error) {
    console.error("Error generating invoice:", error);
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

export { generateVendorOnboardedInvoice };