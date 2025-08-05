import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

import { readFileSync } from "fs";
import path from "path";
import { chromium } from "playwright";
import { sendInvoiceEmail } from "./sendtoEmail.js";
import { sendInvoiceToWhatsApp } from "./sendtoWA.js";
import { uploadToS3 } from "./uploadToS3.js";
import { getInvoiceCount } from "./getInvoiceCount.js";

// Utility function to capitalize first letter of each word
function capitalizeWords(str) {
  if (!str) return "";
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Utility function to convert number to words
function numberToWords(num) {
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];

  function convertHundreds(num) {
    let result = "";

    if (num > 99) {
      result += ones[Math.floor(num / 100)] + " hundred ";
      num %= 100;
    }

    if (num > 19) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    } else if (num > 9) {
      result += teens[num - 10] + " ";
      return result;
    }

    if (num > 0) {
      result += ones[num] + " ";
    }

    return result;
  }

  if (num === 0) return "zero";

  let result = "";
  let crores = Math.floor(num / 10000000);
  let lakhs = Math.floor((num % 10000000) / 100000);
  let thousands = Math.floor((num % 100000) / 1000);
  let hundreds = num % 1000;

  if (crores > 0) {
    result += convertHundreds(crores) + "crore ";
  }

  if (lakhs > 0) {
    result += convertHundreds(lakhs) + "lakh ";
  }

  if (thousands > 0) {
    result += convertHundreds(thousands) + "thousand ";
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

  let result = capitalizeWords(numberToWords(rupees)) + " Rupees";

  if (paise > 0) {
    result += " and " + capitalizeWords(numberToWords(paise)) + " Paise";
  }

  return result + " Only";
}

// Utility function to get vendor type from serviceIds
function getVendorType(serviceIds) {
  const typeMap = {
    caterer: "Caterer",
    decorator: "Decorator",
    "venue-provider": "Venue Provider",
    "prop-rental": "Prop Rental",
    pav: "Photographers & Videographers",
    photographer: "Photographers & Videographers",
    makeupArtist: "Makeup Artist",
    "makeup-artist": "Makeup Artist",
    "dj-artist": "DJ Artist",
  };

  if (serviceIds && serviceIds.length > 0) {
    return typeMap[serviceIds[0].serType] || "Service Provider";
  }

  return "Service Provider";
}

async function generateVendorOnboardedInvoice(customer, paymentDetails) {
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
    
    // Calculate net amount and tax amount based on ORIGINAL total amount (before discount)
    const originalNetAmount = totalAmount / 1.18; // Net amount before discount
    const originalTaxAmount = totalAmount - originalNetAmount; // Tax amount before discount

    // Determine payment method
    let paymentMethod = paymentDetails.method;
    if (discountAmount >= totalAmount) {
      paymentMethod = "Eventory-Coupon-Code";
    }

    // Format invoice date
    const invoiceDate = paymentDetails.invoiceDate || new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY format

    // Get vendor type
    const vendorType = getVendorType(customer.serviceIds);

    // Determine coupon code for discount row
    let couponCode = "DISCOUNT";
    if (paymentDetails.couponCode) {
      couponCode = paymentDetails.couponCode.toUpperCase();
    }

    // Check if customer is in Delhi (pincode starts with "1")
    const isDelhiPincode = customer.businessDetails.pinCode.toString().startsWith("1");

    // Create table rows with tax logic
    let tableRows = "";

    if (isDelhiPincode) {
      // Split into CGST and SGST rows for Delhi
      const cgstAmount = originalTaxAmount / 2;
      const sgstAmount = originalTaxAmount / 2;
      
      tableRows = `
        <tr>
          <td style="text-align: center;">1</td>
          <td>Eventory Vendor Registration</td>
          <td style="text-align: center;">${vendorType}</td>
          <td style="text-align: center;">Rs ${originalNetAmount.toFixed(2)}</td>
          <td style="text-align: center;">9%</td>
          <td style="text-align: center;">CGST</td>
          <td style="text-align: center;">Rs ${cgstAmount.toFixed(2)}</td>
          <td rowspan="2" style="text-align: center;">Rs ${totalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="text-align: center;">&nbsp;</td>
          <td>&nbsp;</td>
          <td style="text-align: center;">&nbsp;</td>
          <td style="text-align: center;">&nbsp;</td>
          <td style="text-align: center;">9%</td>
          <td style="text-align: center;">SGST</td>
          <td style="text-align: center;">Rs ${sgstAmount.toFixed(2)}</td>
        </tr>
      `;
    } else {
      // Single IGST row for other states
      tableRows = `
        <tr>
          <td style="text-align: center;">1</td>
          <td>Eventory Vendor Registration</td>
          <td style="text-align: center;">${vendorType}</td>
          <td style="text-align: center;">Rs ${originalNetAmount.toFixed(2)}</td>
          <td style="text-align: center;">18%</td>
          <td style="text-align: center;">IGST</td>
          <td style="text-align: center;">Rs ${originalTaxAmount.toFixed(2)}</td>
          <td style="text-align: center;">Rs ${totalAmount.toFixed(2)}</td>
        </tr>
      `;
    }

    // Apply the same logic to discount rows
    if (discountAmount > 0) {
      const discountNetAmount = discountAmount / 1.18;
      const discountTaxAmount = discountAmount - discountNetAmount;
      
      if (isDelhiPincode) {
        // Split discount into CGST and SGST for Delhi
        const discountCgstAmount = discountTaxAmount / 2;
        const discountSgstAmount = discountTaxAmount / 2;
        
        tableRows += `
          <tr>
            <td style="text-align: center;">2</td>
            <td>Eventory Discount</td>
            <td style="text-align: center;">${couponCode}</td>
            <td style="text-align: center;">Rs ${discountNetAmount.toFixed(2)}</td>
            <td style="text-align: center;">9%</td>
            <td style="text-align: center;">CGST</td>
            <td style="text-align: center;">Rs ${discountCgstAmount.toFixed(2)}</td>
            <td rowspan="2" style="text-align: center;">Rs ${discountAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: center;">&nbsp;</td>
            <td>&nbsp;</td>
            <td style="text-align: center;">&nbsp;</td>
            <td style="text-align: center;">&nbsp;</td>
            <td style="text-align: center;">9%</td>
            <td style="text-align: center;">SGST</td>
            <td style="text-align: center;">Rs ${discountSgstAmount.toFixed(2)}</td>
          </tr>
        `;
      } else {
        // Single IGST discount row for other states
        tableRows += `
          <tr>
            <td style="text-align: center;">2</td>
            <td>Eventory Discount</td>
            <td style="text-align: center;">${couponCode}</td>
            <td style="text-align: center;">Rs ${discountNetAmount.toFixed(2)}</td>
            <td style="text-align: center;">18%</td>
            <td style="text-align: center;">IGST</td>
            <td style="text-align: center;">Rs ${discountTaxAmount.toFixed(2)}</td>
            <td style="text-align: center;">Rs ${discountAmount.toFixed(2)}</td>
          </tr>
        `;
      }
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
    html = html.replace("{{invoiceCount}}", invoiceNumber);
    html = html.replace("{{paymentId}}", paymentDetails.invoiceNumber);
    html = html.replace("{{invoiceDate}}", invoiceDate);
    html = html.replace("{{paymentMethod}}", paymentMethod);
    html = html.replace("{{customerName}}", capitalizeWords(customer.name));
    html = html.replace(
      "{{customerBusinessName}}",
      capitalizeWords(customer.businessDetails.businessName)
    );

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
      `${process.env.URL}/api/add-vendor-invoice`,
      {
        vendorId: customer.id,
        invoiceUrl,
      },
    );
    if (customer.email)
      await sendInvoiceEmail(
        customer.email,
        customer.name,
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