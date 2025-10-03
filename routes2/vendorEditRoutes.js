import express from "express";
import { Vendor } from "../models2/vendor.js";
import { Caterer } from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import Photographer from "../models2/photographerVideographer.js";
import PropRental from "../models/props.js";
import  VenueProvider  from "../models2/venueProvider.js";
import MakeupArtist from "../models2/makeupArtist.js";
import DjArtist from "../models/djArtist.js";
import {Invoices} from "../models2/invoices.js";
import {
  updateVendorAndService,
  updateDetails,
  updateServiceDetails,
  serviceFields,

} from "../controllers2/vendorEditController.js";

const router = express.Router();

// 1. Update API for basic vendor + service details
router.put("/update-service/:serviceId", updateVendorAndService);

// 2. Update service details (company name and description)
router.post("/updateService/:serviceId", updateDetails);

//3. API endpoint to update service details
router.put("/updateService/:serId", updateServiceDetails);

// 4. Get service fields
router.post("/add-vendor-invoice", async (req, res) => {
  const { invoice_url, vendor_id, service_id, type, customer_id, event_id } =
    req.body;

  console.log(
    `Received request to add invoice for vendor ${vendor_id} with URL ${invoice_url}`
  );

  const vendor = await Vendor.findOne({ vendor_id });
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  try {
    //Save the invoice in invoices collection
    const invoice = new Invoices({
      invoice_url,
      vendor_id,
      service_id,
      type,
      customer_id,
      event_id,
    });
    await invoice.save();
    return res.status(200).json({
      message: "Invoice added successfully",
    });
  } catch (error) {
    console.error("Error adding invoice:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

export default router;
