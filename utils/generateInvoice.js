import dotenv from "dotenv";


dotenv.config();

import { readFileSync } from "fs";
import path from "path";
import { uploadInvoiceToS3, getInvoiceCount } from "../controllers/s3Controller.js";
import { Vendor } from "../models/users.js";
import chromium from "@sparticuz/chromium";

const puppeteer =
  process.env.IS_LOCAL === "true"
    ? await import("puppeteer")
    : await import("puppeteer-core");

// Utility function to capitalize first letter of each word
function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Utility function to convert number to words
function numberToWords(num) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  
  function convertHundreds(num) {
    let result = '';
    
    if (num > 99) {
      result += ones[Math.floor(num / 100)] + ' hundred ';
      num %= 100;
    }
    
    if (num > 19) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num > 9) {
      result += teens[num - 10] + ' ';
      return result;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result;
  }
  
  if (num === 0) return 'zero';
  
  let result = '';
  let crores = Math.floor(num / 10000000);
  let lakhs = Math.floor((num % 10000000) / 100000);
  let thousands = Math.floor((num % 100000) / 1000);
  let hundreds = num % 1000;
  
  if (crores > 0) {
    result += convertHundreds(crores) + 'crore ';
  }
  
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + 'lakh ';
  }
  
  if (thousands > 0) {
    result += convertHundreds(thousands) + 'thousand ';
  }
  
  if (hundreds > 0) {
    result += convertHundreds(hundreds);
  }
  
  return result.trim();
}

// Utility function to format amount in words
function formatAmountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = capitalizeWords(numberToWords(rupees)) + ' Rupees';
  
  if (paise > 0) {
    result += ' and ' + capitalizeWords(numberToWords(paise)) + ' Paise';
  }
  
  return result + ' Only';
}

// Utility function to get vendor type from serviceIds
function getVendorType(serviceIds) {
  const typeMap = {
    'caterer': 'Caterer',
    'decorator': 'Decorator', 
    'venue-provider': 'Venue Provider',
    'prop-rental': 'Prop Rental',
    'pav': 'Photographers & Videographers',
    'photographer': 'Photographers & Videographers',
    'makeupArtist': 'Makeup Artist',
    'makeup-artist': 'Makeup Artist'
  };
  
  if (serviceIds && serviceIds.length > 0) {
    return typeMap[serviceIds[0].serType] || 'Service Provider';
  }
  
  return 'Service Provider';
}

async function generateInvoice(customer, paymentDetails) {
  let browser = null;
  let page = null;

  console.log(paymentDetails);
  try {
    const templatePath = path.resolve("templates", "invoiceTemplate.html");
    let html = readFileSync(templatePath, "utf8");
    let css = readFileSync(path.resolve("templates", "style.css"), "utf8");

    // Get invoice count for numbering
    const invoiceCount = await getInvoiceCount();
    const invoiceNumber = invoiceCount + 1;

// Calculate amounts - Convert strings to numbers first
const totalAmount = parseFloat(paymentDetails.amount) || 0;
const discountAmount = parseFloat(paymentDetails.discount) || 0;
const finalAmount = totalAmount - discountAmount;
const netAmount = finalAmount / 1.18; // Remove 18% GST to get net amount
const taxAmount = finalAmount - netAmount;


    // Determine payment method
    let paymentMethod = paymentDetails.method;
    if (discountAmount >= totalAmount) {
      paymentMethod = "Eventory-Coupon-Code";
    }

    // Format invoice date
    const invoiceDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format

    // Get vendor type
    const vendorType = getVendorType(customer.serviceIds);

    // Determine coupon code for discount row
    let couponCode = "DISCOUNT";
    if (paymentDetails.couponCode) {
      couponCode = paymentDetails.couponCode.toUpperCase();
    }

    // Create table rows
    let tableRows = `
      <tr>
        <td>1</td>
        <td>Eventory Vendor Registration</td>
        <td>${vendorType}</td>
        <td>Rs ${netAmount.toFixed(2)}</td>
        <td>18%</td>
        <td>GST</td>
        <td>Rs ${taxAmount.toFixed(2)}</td>
        <td>Rs ${totalAmount.toFixed(2)}</td>
      </tr>
    `;

    if (discountAmount > 0) {
      const discountNetAmount = discountAmount / 1.18;
      const discountTaxAmount = discountAmount - discountNetAmount;
      
      tableRows += `
        <tr>
          <td>2</td>
          <td>Eventory Discount</td>
          <td>${couponCode}</td>
          <td>Rs -${discountNetAmount.toFixed(2)}</td>
          <td>18%</td>
          <td>GST</td>
          <td>Rs -${discountTaxAmount.toFixed(2)}</td>
          <td>Rs -${discountAmount.toFixed(2)}</td>
        </tr>
      `;
    }

    // Create total row
    const totalRow = `
      <tr class="total-row">
        <td colspan="7" style="text-align: right; font-weight: bold; border-top: 2px solid #000;">Total Paid:</td>
        <td style="font-weight: bold; border-top: 2px solid #000;">Rs ${finalAmount.toFixed(2)}</td>
      </tr>
    `;

    // Amount in words row
    const amountInWordsRow = `
      <tr class="amount-words-row">
        <td colspan="8" style="text-align: left; font-style: italic; padding-top: 10px;">
          <strong>Amount in Words:</strong> ${formatAmountInWords(finalAmount)}
        </td>
      </tr>
    `;

    // Replace placeholders with actual data
    html = html.replaceAll("{{invoiceNumber}}", invoiceNumber.toString());
    html = html.replace("{{invoiceDate}}", invoiceDate);
    html = html.replace("{{paymentMethod}}", paymentMethod);
    html = html.replace("{{customerName}}", capitalizeWords(customer.name));
    html = html.replace("{{customerBusinessName}}", capitalizeWords(customer.businessDetails.businessName));
    
    // Handle address with pincode
    const fullAddress = `${customer.businessDetails.businessAddress}, ${customer.businessDetails.pinCode}`;
    html = html.replace("{{customerAddress}}", fullAddress);

    // Handle PAN/GST display
    let panGstDisplay = "";
    if (customer.businessDetails.panNo) {
      panGstDisplay = `PAN: ${customer.businessDetails.panNo}`;
    } else if (customer.businessDetails.gstin) {
      panGstDisplay = `GST: ${customer.businessDetails.gstin}`;
    }
    html = html.replace("{{panGstDisplay}}", panGstDisplay);

    html = html.replace("{{amount}}", `Rs ${finalAmount.toFixed(2)}`);
    html = html.replace("{{vendorId}}", customer.id);
    html = html.replace("{{tableRows}}", tableRows);
    html = html.replace("{{totalRow}}", totalRow);
    html = html.replace("{{amountInWordsRow}}", amountInWordsRow);
    // Launch Puppeteer and create PDF


    browser =
      process.env.IS_LOCAL === "true"
        ? await puppeteer.launch()
        : await puppeteer.launch({
          args: chromium.args,
          // args: [
          //   ...chromium.args,
          //   '--no-sandbox',
          //   '--disable-setuid-sandbox',
          //   '--disable-dev-shm-usage',
          //   '--disable-web-security',
          //   '--disable-features=VizDisplayCompositor'
          // ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,

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

    const invoiceUrl = await uploadInvoiceToS3(
      pdfBuffer,
      `vendors/${customer.id}/invoice-${invoiceNumber}.pdf`,
    );
    console.log("Invoice uploaded to S3:", invoiceUrl);
    const vendor = await Vendor.findOne({ id: customer.id });
    vendor.invoices.push(invoiceUrl);
    await vendor.save();

    console.log("Invoice URL saved to MongoDB");
    const result = {
      fileName: `invoice-${invoiceNumber}.pdf`,
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


export default generateInvoice;
