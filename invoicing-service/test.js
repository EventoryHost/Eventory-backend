import { generateBookingPaymentInvoice } from "./generateInvoice.js";


const customer = {
  id: "USR123",
  name: "john doe",
  address: "221B Baker Street",
  pinCode: "110001", // Use 560001 to test IGST
  email: "john@example.com",
  mobile: "+911234567890",
};

const vendor = {
  id: "VEN456",
  businessDetails: {
    businessName: "Eventory Events",
    businessAddress: "123 Event Street, City",
    pinCode: "110001", // Use 560001 to test IGST
    email: "EventoryEvents@example.com",
    mobile: "+919876543210",
    panNo: "ABCDE1234F",
    gstin: "29ABCDE1234F1Z5", // Use this GSTIN to test IGST
  },
}

const paymentDetails = {
  invoiceNumber: "PAY-1001",
  paymentId: "TXN-DEL-1001",
  method: "Online",
  userType: "customer",
  // REQUIRED BY CODE (used to build rows)
  items: [
    { name: "Hall Booking", type: "Venue", amount: 11800 },
    { name: "Decoration Package", type: "Service", amount: 5900 },
    { name: "Catering Advance", type: "Food", amount: 2360 }
  ],
  // EXTRA FIELDS THE FUNCTION TOUCHES:
  amount: 19080,          // drives finalAmount
  discount: 1180,         // will trigger discount row (note: current logic overwrites previous rows)
  couponCode: "SAVE1000",
  convinienceFee: 200,
  commissionFee: 200,    
  advanceAmount: 5000,
  dueAmount: 10060
};

const result = await generateBookingPaymentInvoice(customer,vendor, paymentDetails);