import { generateBookingPaymentInvoice } from "./generateInvoice.js";

const customer = {
  id: "cust_123",
  name: "Ravi Sharma",
  address: "123 MG Road, Delhi",
  pincode: "110001",
  email: "ravi.sharma@example.com",
  mobile: "9876543210",
};

const vendor = {
  id: "vend_456",
  businessDetails: {
    businessName: "Anil Caterers",
    businessAddress: "Sector 21, Gurgaon",
    pinCode: "122001",
    panNo: "ABCDE1234F",
    gstin: "07ABCDE1234F1Z5",
  },
};

const paymentDetails = {
  invoiceNumber: "order_1002",
  paymentId: "TXN-DEL-3001",
  method: "Card",
  userType: "customer",

  items: [
    { name: "Venue Booking", type: "Conference", amount: 15000.0 },
    { name: "Food Package", type: "Catering", amount: 7000.0 },
    { name: "Lighting", type: "Service", amount: 3000.0 },
  ],

  amount: 25000.0,          // Gross total before discount
  discount: 2000.0,         // Discount applied
  couponCode: "WELCOME2000",
  convinienceFee: 500.0,
  commissionFee: 2500.0,
  advanceAmount: 10000.0,
  dueAmount: 15000.0,
  paymentType: "full",
  paidAmount: "25000.00",

  customerPayable: {
    total: 25000.0,        // Total charged to customer
    baseAmount: 22000.0,   // Base service amount (before convenience & GST)
    convenienceFee: 400.0, // Platform service charge
    taxOnConvenience: 100.0, // GST on convenience
    discount: 2000.0,      // Discounts applied
  },

  vendorReceivable: {
    total: 22500.0,        // What vendor actually gets
    baseAmount: 22000.0,   // Vendor’s net service charge (before commission)
    commission: 2000.0,    // Platform’s commission
    taxOnCommission: 500.0,// GST on commission
  },
};


(async () => {
  try {
    const result = await generateBookingPaymentInvoice(customer, vendor, paymentDetails);
    console.log("PDF saved at:", result); // Output the local file path
  } catch (err) {
    console.error("Error generating invoice:", err);
  }
})();