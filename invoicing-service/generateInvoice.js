import axios from "axios";
import dotenv from "dotenv";
import { writeFileSync, mkdirSync } from "fs";

dotenv.config();

import { readFileSync } from "fs";
import path from "path";
import { chromium } from "playwright";
import { sendInvoiceEmail } from "./sendtoEmail.js";
import { sendCustomerEventBookingMessage, sendInvoiceToWhatsApp, sendVendorEventBookingMessage } from "./sendtoWA.js";
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
    "djArtist": "DJ Artist",
    djArtist: "DJ Artist",
  };


  if (serviceIds && serviceIds.length > 0) {
    return typeMap[serviceIds[serviceIds.length - 1].serType] || typeMap[serviceIds[serviceIds.length].serType] || "Service Provider";
  }

  return "Service Provider";
}

async function generateVendorOnboardedInvoice(customer, paymentDetails) {
  let browser = null;
  let page = null;

  try {
    const templatePath = path.resolve("templates", "onboardInvoiceTemplate.html");
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

    // Service data coming from Cashfree controllers via SQS
    const serviceData = paymentDetails.serviceData || {};

    // Format invoice date
    const invoiceDate = new Date().toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
    });

    // Get vendor type
    const vendorType = getVendorType(customer.serviceIds);

    // Determine coupon code for discount row
    let couponCode = "DISCOUNT";
    if (paymentDetails.couponCode) {
      couponCode = paymentDetails.couponCode.toUpperCase();
    }

    // Check if vendor/service is in Delhi (pincode starts with "1")
    const servicePincode =
      serviceData.service_pincode || serviceData.pincode || null;
    const isDelhiPincode = servicePincode
      ? servicePincode.toString().startsWith("1")
      : false;

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

    // Name and business details from serviceData + vendor
    const contactName =
      serviceData.point_of_contact || customer.name || "Valued Partner";
    const businessName =
      serviceData.business_registration_name || "Business";

    const addressLine =
      serviceData.business_address || serviceData.service_address || "";
    const pinForAddress =
      serviceData.pincode || serviceData.service_pincode || "";
    const fullAddress = pinForAddress
      ? `${addressLine}, ${pinForAddress}`
      : addressLine;

    // Handle PAN/GST display (from service data)
    let panGstDisplay = "";
    if (serviceData.pan) {
      panGstDisplay = `PAN: ${serviceData.pan}`;
    } else if (serviceData.gst) {
      panGstDisplay = `GST: ${serviceData.gst}`;
    }

    // Replace placeholders with actual data
    html = html.replace("{{invoiceCount}}", invoiceNumber);
    html = html.replace("{{paymentId}}", paymentDetails.invoiceNumber);
    html = html.replace("{{invoiceDate}}", invoiceDate);
    html = html.replace("{{paymentMethod}}", paymentMethod);
    html = html.replace("{{customerName}}", capitalizeWords(contactName));
    html = html.replace(
      "{{customerBusinessName}}",
      capitalizeWords(businessName),
    );
    html = html.replace("{{customerAddress}}", fullAddress);
    html = html.replace("{{panGstDisplay}}", panGstDisplay);
    html = html.replace("{{amount}}", `Rs ${finalAmount.toFixed(2)}`);
    html = html.replace(
      "{{vendorId}}",
      customer.vendor_id || customer.id || "",
    );
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
      `vendors/${customer.vendor_id || customer.id}/invoice-${paymentDetails.invoiceNumber}.pdf`,
    );


    // Create invoice record in new Invoices collection
    await axios.post(`${process.env.URL}/api/invoices`, {
      invoice_url: invoiceUrl,
      type: "registration",
      invoice_for: "vendor",
      payment_label: "registration",
      vendor_id: customer.vendor_id || customer.id,
      service_id:
        (serviceData && serviceData._id) ||
        paymentDetails.serviceId ||
        "VENDOR_REGISTRATION",
      customer_id: null,
      event_id: null,
      transaction_id: paymentDetails.transaction_id || null,
    });


    await sendInvoiceEmail({
      to:
        customer.email_address ||
        customer.email ||
        "event-vendor-onboardi-aaaaqhbbkgsagqwcg6mbxser4a@eventory-hq.slack.com",
      name: contactName,
      pdfBuffer,
      pdfFileName: `invoice-${paymentDetails.invoiceNumber}.pdf`,
    });

    await sendInvoiceToWhatsApp(
      invoiceUrl,
      customer.vendor_mobile || serviceData.service_contact_number,
      contactName,
    );

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

export async function generateBookingPaymentInvoice(customer, vendor, paymentDetails) {
  let browser = null;
  let page = null;
  let pdfPath = "";

  try {
    const templatePath = path.resolve("templates", "bookingPaymentInvoice.html");
    let html = readFileSync(templatePath, "utf8");
    const css = readFileSync(path.resolve("templates", "style.css"), "utf8");

    const invoiceCount = await getInvoiceCount();
    const invoiceNumber = invoiceCount + 1;

    const items = Array.isArray(paymentDetails.items) ? paymentDetails.items : [];
    const totalAmount = Number(paymentDetails.amount) || 0;
    const discountAmount = Number(paymentDetails.discount) || 0;
    const finalAmount = Math.max(0, paymentDetails.finalAmount || paymentDetails.amount);
    const convinienceFee = Number(paymentDetails.convinienceFee) || 0;
    const commissionFee = Number(paymentDetails.commissionFee) || 0;
    const couponCode = (paymentDetails.couponCode || "").toString().toUpperCase();
    const paymentId = paymentDetails.invoiceNumber || paymentDetails.paymentId || "-";
    const paymentMethod =
      discountAmount >= totalAmount
        ? "Eventory-Coupon-Code"
        : paymentDetails.method || "Online";
    const paymentType = paymentDetails.paymentType || null;
    const isConsolidated = (paymentType || "").toLowerCase() === "consolidated";
    // Clean "Advance 1" → "Advance" for display (strip trailing digit when only one advance)
    const paymentTypeDisplay = isConsolidated ? "Full" : (paymentType ? paymentType.replace(/^(Advance)\s*\d*$/i, '$1') : null);

    // Generate a filename-friendly payment label from paymentType
    const paymentLabel = (() => {
      if (!paymentType) return "payment";
      const t = paymentType.toLowerCase().replace(/\s+/g, "");
      if (t === "consolidated") return "consolidated";
      if (t === "token") return "token";
      if (t === "full") return "fullpay";
      if (t === "remaining") return "remaining";
      if (t === "finalpay") return "finalpay";
      if (t === "lastpay") return "lastpay";
      if (t.startsWith("advance")) return t; // "advance1", "advance2", etc.
      return t; // fallback: use normalized string
    })();
    const paidAmountNum = (() => {
      if (isConsolidated) return finalAmount; // Consolidated = full amount
      const explicit = Number(paymentDetails.paidAmount || 0);
      const ptLower = (paymentType || "").toLowerCase();
      if (ptLower === "full") return finalAmount;
      // For any partial payment (Token, Advance, Advance 1, remaining, etc.) use the explicit paidAmount
      return explicit || finalAmount;
    })();

    const invoiceDate = new Date().toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
    });
    // Service data from SQS
    const serviceData = paymentDetails.serviceData || {};

    // Prefer GST-based Delhi detection (matching admin logic)
    const customerGst = customer.gstin || customer.gst || "";
    const vendorGst =
      serviceData?.business_details?.gst
      || vendor.businessDetails?.gstin
      || "";

    let runningSerial = 1;
    let tableRows = "";
    let tableHeader = "";
    let colspan = "7";

    // --- CUSTOMER INVOICE ---
    const hasCustomerGst = !!customerGst;
    const isDelhiCustomer = !hasCustomerGst || String(customerGst).startsWith("07");

    if (isDelhiCustomer) {
      tableHeader = `
            <th>S.No.</th>
            <th>Item Details</th>
            <th>Net Amount</th>
            <th>CGST %</th>
            <th>CGST</th>
            <th>SGST %</th>
            <th>SGST</th>
            <th>Total Amount</th>
      `;
      colspan = "7";
    } else {
      tableHeader = `
            <th>S.No.</th>
            <th>Item Details</th>
            <th>Net Amount</th>
            <th>IGST %</th>
            <th>IGST</th>
            <th>Total Amount</th>
      `;
      colspan = "5";
    }

    let totalNetAmount = 0;
    let totalTaxAmount = 0;
    let totalGrossAmount = 0;

    // Build a map for Vendor Serials to maintain anonymity
    const vendorSerialMap = new Map();
    let currentVendorSerial = 1;
    items.forEach(item => {
        if (item.vendor_id && !vendorSerialMap.has(item.vendor_id)) {
            vendorSerialMap.set(item.vendor_id, currentVendorSerial++);
        }
    });

    items.forEach((item) => {
      const gross = Number(item.amount) || 0;
      const net = gross / 1.18;
      const tax = gross - net;

      totalNetAmount += net;
      totalTaxAmount += tax;
      totalGrossAmount += gross;

      let displayName = item.name || item.name_of_service || "Item";
      if (item.vendor_id && vendorSerialMap.has(item.vendor_id)) {
          displayName = `Vendor ${vendorSerialMap.get(item.vendor_id)} - ${displayName}`;
      }

      if (isDelhiCustomer) {
        const half = tax / 2;
        tableRows += `
          <tr>
            <td style="text-align:center;">${runningSerial}</td>
            <td>${displayName}</td>
            <td style="text-align:center;">Rs ${net.toFixed(2)}</td>
            <td style="text-align:center;">9%</td>
            <td style="text-align:center;">Rs ${half.toFixed(2)}</td>
            <td style="text-align:center;">9%</td>
            <td style="text-align:center;">Rs ${half.toFixed(2)}</td>
            <td style="text-align:center;">Rs ${gross.toFixed(2)}</td>
          </tr>
        `;
      } else {
        tableRows += `
          <tr>
            <td style="text-align:center;">${runningSerial}</td>
            <td>${displayName}</td>
            <td style="text-align:center;">Rs ${net.toFixed(2)}</td>
            <td style="text-align:center;">18%</td>
            <td style="text-align:center;">Rs ${tax.toFixed(2)}</td>
            <td style="text-align:center;">Rs ${gross.toFixed(2)}</td>
          </tr>
        `;
      }
      runningSerial++;
    });

    // Subtotal row for customer invoices
    if (isDelhiCustomer) {
      tableRows += `
          <tr style="background:#f8f9fa;">
            <td></td>
            <td style="text-align:right; font-weight:bold;">Subtotal:</td>
            <td style="text-align:center; font-weight:bold;">Rs ${totalNetAmount.toFixed(2)}</td>
            <td></td>
            <td style="text-align:center; font-weight:bold;">Rs ${(totalTaxAmount / 2).toFixed(2)}</td>
            <td></td>
            <td style="text-align:center; font-weight:bold;">Rs ${(totalTaxAmount / 2).toFixed(2)}</td>
            <td style="text-align:center; font-weight:bold;">Rs ${totalGrossAmount.toFixed(2)}</td>
          </tr>
      `;
    } else {
      tableRows += `
          <tr style="background:#f8f9fa;">
            <td></td>
            <td style="text-align:right; font-weight:bold;">Subtotal:</td>
            <td style="text-align:center; font-weight:bold;">Rs ${totalNetAmount.toFixed(2)}</td>
            <td></td>
            <td style="text-align:center; font-weight:bold;">Rs ${totalTaxAmount.toFixed(2)}</td>
            <td style="text-align:center; font-weight:bold;">Rs ${totalGrossAmount.toFixed(2)}</td>
          </tr>
      `;
    }



    const discountTotalsRow =
      discountAmount > 0
        ? `
      <tr class="total-row">
        <td colspan="${colspan}" style="text-align:right;font-weight:bold;">Discount${couponCode ? ` (${couponCode})` : ""}:</td>
        <td style="font-weight:bold;color:#16A34A; text-align:center;">- Rs ${discountAmount.toFixed(2)}</td>
      </tr>`
        : "";

    const alreadyPaidTotal = isConsolidated ? finalAmount : Number(paymentDetails.alreadyPaidAmount || paidAmountNum);
    const balanceDue = isConsolidated ? 0 : Math.max(0, finalAmount - alreadyPaidTotal);
    const balanceRow = balanceDue > 0
      ? `
       <tr class="total-row">
         <td colspan="${colspan}" style="text-align:right;font-weight:bold;">Balance Due:</td>
         <td style="font-weight:bold; text-align:center;">Rs ${balanceDue.toFixed(2)}</td>
       </tr>`
      : "";

    const previousPaymentsNum = isConsolidated ? 0
      : ((paymentDetails.alreadyPaidAmount && Number(paymentDetails.alreadyPaidAmount) > paidAmountNum)
        ? Number(paymentDetails.alreadyPaidAmount) - paidAmountNum
        : 0);

    const previousPaymentsRow = previousPaymentsNum > 0
      ? `
       <tr class="total-row">
         <td colspan="${colspan}" style="text-align:right;font-weight:bold;">Previous Payments:</td>
         <td style="font-weight:bold; text-align:center;">Rs ${previousPaymentsNum.toFixed(2)}</td>
       </tr>`
      : "";

    const ccfTax = Number(paymentDetails.customerPayable?.taxOnConvenience) || (convinienceFee - (convinienceFee / 1.18));
    const ccfBase = convinienceFee - ccfTax;

    let totalRow = `
       <tr class="total-row">
         <td colspan="${colspan}" style="text-align:right;font-weight:bold;border-top: 2px solid #000;">Total convenience:</td>
         <td style="font-weight:bold;border-top: 2px solid #000; text-align:center;">Rs ${ccfBase.toFixed(2)}</td>
       </tr>
       <tr class="total-row">
         <td colspan="${colspan}" style="text-align:right;font-weight:bold;">Total GST on convenience:</td>
         <td style="font-weight:bold; text-align:center;">Rs ${ccfTax.toFixed(2)}</td>
       </tr>
       ${discountTotalsRow}
       <tr class="total-row">
         <td colspan="${colspan}" style="text-align:right;font-weight:bold;">Total to be paid:</td>
         <td style="font-weight:bold; text-align:center;">Rs ${finalAmount.toFixed(2)}</td>
       </tr>
       ${previousPaymentsRow}
       <tr class="total-row">
         <td colspan="${colspan}" style="text-align:right;font-weight:bold;">Paid (${(paymentTypeDisplay || 'Full').replace(/([a-z])(\d)/g, '$1 $2').toUpperCase()}):</td>
         <td style="font-weight:bold; text-align:center;">Rs ${paidAmountNum.toFixed(2)}</td>
       </tr>
       ${balanceRow}
    `;

    const amountInWordsRow = `
      <tr class="amount-words-row">
        <td colspan="${Number(colspan) + 1}" style="text-align:left;font-style:italic;padding-top:10px;">
          <strong>Amount Paid:</strong> ${formatAmountInWords(paidAmountNum)}
        </td>
      </tr>
    `;

    const userDetails = `
      <p><strong>${capitalizeWords(customer.name || "")}</strong></p>
      <p>${customer.address || ""}</p>
      <p>${customer.pincode || customer.pinCode || ""}</p>
      ${customerGst ? `<p>GST: ${customerGst}</p>` : ""}
    `;

    // NEW: prefer service business_details, fallback to vendor.businessDetails
    const vendorBusinessName =
      serviceData?.business_details?.business_registration_name
      || vendor.businessDetails?.businessName
      || "";
    const vendorBusinessAddress =
      serviceData?.business_details?.business_address
      || vendor.businessDetails?.businessAddress
      || "";
    const vendorPincode =
      serviceData?.business_details?.pincode
      || vendor.businessDetails?.pinCode
      || "";
    const vendorPan =
      serviceData?.business_details?.pan
      || vendor.businessDetails?.panNo;

    const vendorDetails = `
      <p><strong>${capitalizeWords(vendorBusinessName)}</strong></p>
      <p>${vendorBusinessAddress}</p>
      <p>${vendorPincode}</p>
      <p>${vendorPan ? `PAN: ${vendorPan}` : ""}</p>
      <p>${vendorGst ? `GST: ${vendorGst}` : ""}</p>
    `;

    const advanceDetails = "";
    let id = `
      <p><strong>Customer ID:</strong></p>
      <p>${customer.id}</p>
    `;

    const signatureRow = `
      <tr class="signature-row">
        <td colspan="${Number(colspan) - 2}" style="padding-top: 30px; border-right: none;">
          <!-- Empty left space -->
        </td>
        <td colspan="3" style="padding-top: 30px; text-align: right; border-left: none; padding-right: 20px;">
          <p style="margin: 0; margin-bottom: 15px;"><strong>For EVENTORY TECH SOLUTIONS PVT LIMITED:</strong></p>
          <img src="https://d5b8uhuzdzhj3.cloudfront.net/assets/vendor_onboarding/sign.png" alt="Signature"
            style="width: 120px; height: 40px; display: block; margin-bottom: 10px; margin-left: auto;" />
          <p style="margin: 0; font-size: 12px;"><strong>Authorized Signatory</strong></p>
        </td>
      </tr>
    `;

    const vendorBlock = `
      <div class="billed-to">
        <h3><strong>Issued to:</strong></h3>
        <div class="customer-info">
          ${vendorDetails}
        </div>
      </div>
    `;

    const customerBlock = `
      <div class="billed-to">
        <h3><strong>Issued to:</strong></h3>
        <div class="customer-info">
          ${userDetails}
        </div>
      </div>
    `;

    // For consolidated invoices, override the title
    if (isConsolidated) {
      html = html.replace(
        '<h2><strong>INVOICE - {{invoiceCount}}</strong></h2>',
        `<h2><strong>CONSOLIDATED INVOICE - {{invoiceCount}}</strong></h2>`
      );
    }

    html = html
      .replace("{{invoiceCount}}", invoiceNumber)
      .replace("{{paymentId}}", paymentId)
      .replace("{{paymentMethod}}", paymentMethod)
      .replace("{{invoiceDate}}", invoiceDate)
      .replace("{{amount}}", `Rs ${paidAmountNum.toFixed(2)}`)
      .replace("{{userId}}", id)
      .replace("{{vendorBlock}}", "")
      .replace("{{customerBlock}}", customerBlock)
      .replace("{{tableHeader}}", tableHeader)
      .replace("{{tableRows}}", tableRows)
      .replace("{{totalRow}}", totalRow)
      .replace("{{amountInWordsRow}}", amountInWordsRow)
      .replace("{{signatureRow}}", signatureRow);

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.addStyleTag({ content: css });
    let pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    if (page && !page.isClosed()) await page.close();
    if (browser) await browser.close();

    const custInvoiceUrl = await uploadToS3(
      pdfBuffer,
      `bookings/${paymentDetails.event_id}/customers/${customer.id}/customer-${paymentLabel}.pdf`
    );


    // Decide invoice type for this payment
    const ptLower = (paymentType || "").toLowerCase();
    const isFullOrFinal = ptLower === "full" || ptLower === "remaining" || ptLower.includes("final") || ptLower.includes("last") || ptLower === "consolidated";
    const invoiceType = isFullOrFinal ? "booking" : "advance_booking";

    const customerId = customer.id; // from customerPayload
    const vendorId = vendor.id;     // from vendorPayload
    const serviceId =
      paymentDetails.serviceData?.service_id ||  // from serviceSnapshot
      paymentDetails.service_id ||               // fallback if you add it flat later
      paymentDetails.serviceId ||                // old caller fallback
      "BOOKING_SERVICE";
    const eventId = paymentDetails.event_id || paymentDetails.eventId || null;

    // Create CUSTOMER invoice record in new Invoices collection
    const baseUrl = process.env.URL.startsWith('http') ? process.env.URL : `https://${process.env.URL}`;
    await axios.post(`${baseUrl}/api/invoices`, {
      invoice_url: custInvoiceUrl,
      type: invoiceType,          // 'advance_booking' | 'booking' | 'payment'
      invoice_for: 'customer',
      payment_label: paymentLabel,
      vendor_id: vendorId,
      service_id: serviceId,
      customer_id: customerId,
      event_id: eventId,
      transaction_id: paymentDetails.transaction_id || null,
    });

    // if (customer.mobile) {
    //   await sendCustomerEventBookingMessage(
    //     custInvoiceUrl,
    //     customer.mobile,
    //     paymentDetails.date
    //   );
    // }

    // ── VENDOR INVOICE PDF GENERATION (MULTI-VENDOR SUPPORT) ──
    const vendorSegments = (paymentDetails.vendor_segments && paymentDetails.vendor_segments.length > 0)
      ? paymentDetails.vendor_segments
      : [{
        vendor_id: vendor.id,
        service_id: paymentDetails.service_id || paymentDetails.serviceId || "BOOKING_SERVICE",
        vendor_name: vendor.businessDetails?.businessName || "Vendor",
        paymentDetails: paymentDetails,
        serviceData: paymentDetails.serviceData || {}
      }];

    console.log(`[Invoicing] Generating invoices for ${vendorSegments.length} vendor segment(s)`);

    for (const segment of vendorSegments) {
      const segVendorId = segment.vendor_id;
      const segServiceId = segment.service_id;
      const segVendorName = segment.vendor_name || "Vendor";
      const segServiceData = segment.serviceData || {};

      // Calculate segment-specific totals
      const segCommission = Number(segment.paymentDetails?.vendorReceivable?.commission || 0);
      const segTotalReceivable = Number(segment.paymentDetails?.vendorReceivable?.total || 0);

      // Calculate share of paid amount for this vendor
      // If it's a full payment, they get their total share.
      // If partial, we derive it from their share of this specific milestone (available in paymentBreakdowns)
      let segPaidAmount = 0;
      if (isConsolidated || ptLower === "full" || ptLower === "remaining") {
        segPaidAmount = segTotalReceivable;
      } else {
        const milestone = (segment.paymentBreakdowns || []).find(b => b.name === paymentType);
        segPaidAmount = milestone ? Number(milestone.amount || 0) : 0;
      }

      // If zero paid for this vendor in this milestone, skip their specific invoice for now?
      // Actually, we should probably generate it anyway if it's a booking event.
      if (segPaidAmount <= 0 && ptLower !== "full") {
        console.log(`[Invoicing] Skipping vendor invoice for ${segVendorId} as paid amount is 0`);
        continue;
      }

      tableRows = "";
      runningSerial = 1;

      // Filter items for this vendor
      const segItems = items.filter(item => item.vendor_id === segVendorId || item.service_id === segServiceId);
      // Fallback if no items matched (single vendor compatibility)
      const itemsToDisplay = segItems.length > 0 ? segItems : items;

      itemsToDisplay.forEach((item) => {
        const gross = Number(item.amount) || 0;
        const net = gross / 1.18;
        const tax = gross - net;
        tableRows += `
          <tr>
            <td style="text-align:center;">${runningSerial}</td>
            <td>${item.name || "Item"}</td>
            <td style="text-align:center;">Rs ${net.toFixed(2)}</td>
            <td style="text-align:center;">18%</td>
            <td style="text-align:center;">Rs ${tax.toFixed(2)}</td>
            <td style="text-align:center;">Rs ${gross.toFixed(2)}</td>
          </tr>
        `;
        runningSerial++;
      });

      const segVendorDetails = `
        <p><strong>${capitalizeWords(segServiceData?.business_details?.business_registration_name || segVendorName)}</strong></p>
        <p>${segServiceData?.business_details?.business_address || ""}</p>
        <p>${segServiceData?.business_details?.pincode || ""}</p>
        <p>${segServiceData?.business_details?.pan ? `PAN: ${segServiceData.business_details.pan}` : ""}</p>
        <p>${segServiceData?.business_details?.gst ? `GST: ${segServiceData.business_details.gst}` : ""}</p>
      `;

      const segVendorTotalRow = `
        <tr class="total-row">
          <td colspan="5" style="text-align:right;font-weight:bold;border-top: 2px solid #000;">Vendor Commission:</td>
          <td style="font-weight:bold;border-top: 20px solid #000; text-align:center;">- Rs ${segCommission.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="5" style="text-align:right;font-weight:bold;">Total Receivable:</td>
          <td style="font-weight:bold; text-align:center;">Rs ${segTotalReceivable.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="5" style="text-align:right;font-weight:bold;">Received:</td>
          <td style="font-weight:bold; text-align:center;">Rs ${segPaidAmount.toFixed(2)}</td>
        </tr>
      `;

      const segAmountWordsRow = `
        <tr class="amount-words-row">
          <td colspan="6" style="text-align:left;font-style:italic;padding-top:10px;">
            <strong>Amount Received:</strong> ${formatAmountInWords(segPaidAmount)}
          </td>
        </tr>
      `;

      const segIdHtml = `
        <p><strong>Vendor ID:</strong></p>
        <p>${segVendorId}</p>
      `;

      html = readFileSync(templatePath, "utf8");
      // For consolidated invoices, override the vendor invoice title too
      if (isConsolidated) {
        html = html.replace(
          '<h2><strong>INVOICE - {{invoiceCount}}</strong></h2>',
          `<h2><strong>CONSOLIDATED INVOICE - {{invoiceCount}}</strong></h2>`
        );
      }
      html = html
        .replace("{{invoiceCount}}", invoiceNumber)
        .replace("{{paymentId}}", paymentId)
        .replace("{{paymentMethod}}", paymentMethod)
        .replace("{{invoiceDate}}", invoiceDate)
        .replace("{{amount}}", `Rs ${segPaidAmount.toFixed(2)}`)
        .replace("{{userId}}", segIdHtml)
        .replace("{{vendorBlock}}", `
          <div class="billed-to">
            <h3><strong>Issued to:</strong></h3>
            <div class="customer-info">
              ${segVendorDetails}
            </div>
          </div>
        `)
        .replace("{{customerBlock}}", "")
        .replace("{{tableHeader}}", `
          <th>S.No.</th>
          <th>Item Details</th>
          <th>Net Amount</th>
          <th>GST %</th>
          <th>GST</th>
          <th>Total Amount</th>
        `)
        .replace("{{tableRows}}", tableRows)
        .replace("{{totalRow}}", segVendorTotalRow)
        .replace("{{amountInWordsRow}}", segAmountWordsRow)
        .replace("{{signatureRow}}", signatureRow);

      browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      await page.addStyleTag({ content: css });
      const segPdfBuffer = await page.pdf({ format: "A4", printBackground: true });

      if (page && !page.isClosed()) await page.close();
      if (browser) await browser.close();

      const venInvoiceUrl = await uploadToS3(
        segPdfBuffer,
        `bookings/${eventId}/vendors/${segVendorId}/vendor-${paymentLabel}.pdf`
      );

      // Create VENDOR invoice record in database
      const vBaseUrl = process.env.URL.startsWith('http') ? process.env.URL : `https://${process.env.URL}`;
      await axios.post(`${vBaseUrl}/api/invoices`, {
        invoice_url: venInvoiceUrl,
        type: isFullOrFinal ? "booking" : "advance_booking",
        invoice_for: 'vendor',
        payment_label: paymentLabel,
        vendor_id: segVendorId,
        service_id: segServiceId,
        customer_id: customerId,
        event_id: eventId,
        transaction_id: paymentDetails.transaction_id || null,
      });

      console.log(`[Invoicing] Generated vendor invoice for ${segVendorId}: ${venInvoiceUrl}`);
    }
  } catch (err) {
    console.error("[Invoicing] ERROR generating booking invoice:", err.message);
    if (err.response) console.error("[Invoicing] API Error Details:", JSON.stringify(err.response.data));
    try {
      if (page && !page.isClosed()) await page.close();
      if (browser) await browser.close();
    } catch { }
  }

  return pdfPath;
}

export { generateVendorOnboardedInvoice };