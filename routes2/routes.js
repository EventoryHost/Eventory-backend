import { Router } from "express";

// Import all your route files here
import productRoutes from "../routes2/productRoutes.js";
import authRoutes from "../routes2/authRoutes.js";
import emailRoutes from "../routes2/emailRoutes.js";
import aboutEmailRoutes from "../routes2/aboutEmailRoutes.js";
import cashfreeRoutes from "../routes2/cashfreeRoutes.js";
import queryRoutes from "../routes2/queryRoutes.js";
import { businessDetailsRoutes } from "../routes2/reduxRoutes/businessDetails.js";
import fileRoutes from "../routes2/fileRoutes.js";
import quotationRoutes from "../routes2/quotationRoutes.js";
import verificationRoutes from "../routes2/verificationRoutes.js";
import BookingRoutes from "../routes2/bookingRoutes.js";
import vendorEditRoutes from "../routes2/vendorEditRoutes.js";
import serviceRouter from "../routes2/servicesRoutes.js";
import venueRouter from "../routes/venueRoutes.js";
import featuredVendorsRoutes from "../routes2/featuredVendorsRoutes.js";
import customerRoutes from "../routes2/customerRoutes.js";
import contactRoutes from "../routes2/contactRoutes.js";
import reviewRoutes from "../routes2/reviewRoutes.js";
import chatRoutes from "../routes2/chatRoutes.js";
import waRoutes from "../routes2/waHooks.js";
import emadminRoutes from "../routes2/emadminRoutes.js";
import salesRoutes from "../routes2/salesRoutes.js";
import Vendor from "../routes/vendorRoutes.js";
import finalOrders from "../routes2/finalOrders.js";
import agreementRoutes from "../routes2/agreementRoutes.js";
import couponRoutes from "../routes2/couponRoutes.js";
import catererPersistenceRoutes from "../routes2/reduxRoutes/caterer.js";
import decoratorPersistenceRoutes from "../routes2/reduxRoutes/decorator.js";
import makeupArtistPersistenceRoutes from "../routes2/reduxRoutes/makeUpArtist.js";
import photographerPersistenceRoutes from "../routes2/reduxRoutes/photographers.js";
import venueProviderPersistenceRoutes from "../routes2/reduxRoutes/venue-provider.js";
import updatePageRoutes from "../routes2/updatePageRoutes.js";
import vendorNotificationRoutes from "../routes2/vendorNotificationRoutes.js";
import emNotificationRoutes from "../routes2/emNotificationRoutes.js";
import customerNotificationRoutes from "../routes2/customerNotificationRoutes.js";
import invoiceRoutes from "../routes2/invoiceRoutes.js";

export default function MainRoutes(io) {
  const router = Router();

// // Attach all routes here
router.use("/products", productRoutes);
router.use("/payment", cashfreeRoutes);
router.use("/auth", authRoutes);
router.use("/query", queryRoutes);
router.use("/email", emailRoutes);
router.use("/about-email", aboutEmailRoutes);
router.use("/files", fileRoutes);
router.use("/quotations", quotationRoutes(io));
router.use("/chats", chatRoutes);
router.use("/verification", verificationRoutes);
router.use("/bookings", BookingRoutes);
router.use("/service", serviceRouter);

// router.use("/venue", venueRouter);
router.use("/featured-vendors", featuredVendorsRoutes);
router.use("/customer", customerRoutes);
router.use("/contact", contactRoutes);
router.use("/review", reviewRoutes);
router.use("/emadmin", emadminRoutes);
router.use("/sales", salesRoutes);
// router.use("/vendors", Vendor);
router.use("/final-orders", finalOrders);
router.use("/agreements", agreementRoutes);
router.use("/coupons", couponRoutes);
router.use("/catering-details", catererPersistenceRoutes);
router.use("/decorator-details", decoratorPersistenceRoutes);
router.use("/makeup-artist-details", makeupArtistPersistenceRoutes);
router.use("/photographer-details", photographerPersistenceRoutes);
router.use("/venue-provider-details", venueProviderPersistenceRoutes);
// router.use("/business-details", businessDetailsRoutes); Not to be done
router.use("/update-page", updatePageRoutes);
router.use("/vendor-edit", vendorEditRoutes);
router.use("/vendor-notifications", vendorNotificationRoutes);
router.use("/em-notifications", emNotificationRoutes);
router.use("/customer-notifications", customerNotificationRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/webhook", waRoutes); 

return router;
}
