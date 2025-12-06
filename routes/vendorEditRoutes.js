import express from "express";
import { Vendor } from "../models/vendor.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decorator.js";
import Photographer from "../models/photographerVideographer.js";
import  VenueProvider  from "../models/venueProvider.js";
import MakeupArtist from "../models/makeupArtist.js";
import DjArtist from "../models/djArtist.js";
import {
  updateVendorAndService,
  updateDetails,
  updateServiceDetails,
  serviceFields,
  addVendorInvoice,
  deleteServiceProfile,

} from "../controllers/vendorEditController.js";

const router = express.Router();

// 1. Update API for basic vendor + service details
router.put("/update-service/:serviceId", updateVendorAndService);

// 2. Update service details (company name and description)
router.post("/updateService/:serviceId", updateDetails);

//3. API endpoint to update service details
router.put("/updateService/:serId", updateServiceDetails);

// 🛑 4. API endpoint to delete a service profile
// example call http://localhost:4000/api/vendor-edit/delete-service/CAT17102025213247194
router.delete("/delete-service/:service_id", deleteServiceProfile); 

// 5. Get service fields
router.post("/add-vendor-invoice", addVendorInvoice);

export default router;
