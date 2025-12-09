import { Router } from "express";

// Import all your route files here
import productRoutes from "../routes/productRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import emailRoutes from "../routes/emailRoutes.js";
import aboutEmailRoutes from "../routes/aboutEmailRoutes.js";
import cashfreeRoutes from "../routes/cashfreeRoutes.js";
import queryRoutes from "../routes/queryRoutes.js";
import { businessDetailsRoutes } from "../routes/reduxRoutes/businessDetails.js";
import fileRoutes from "../routes/fileRoutes.js";
import quotationRoutes from "../routes/quotationRoutes.js";
import verificationRoutes from "../routes/verificationRoutes.js";
import BookingRoutes from "../routes/bookingRoutes.js";
import vendorEditRoutes from "../routes/vendorEditRoutes.js";
import serviceRouter from "../routes/servicesRoutes.js";
import mediaRoutes from "../routes/mediaRoutes.js";
import featuredVendorsRoutes from "../routes/featuredVendorsRoutes.js";
import customerRoutes from "../routes/customerRoutes.js";
import contactRoutes from "../routes/contactRoutes.js";
import reviewRoutes from "../routes/reviewRoutes.js";
import chatRoutes from "../routes/chatRoutes.js";
import waRoutes from "../routes/waHooks.js";
import emadminRoutes from "../routes/emadminRoutes.js";
import salesRoutes from "../routes/salesRoutes.js";
import Vendor from "../routes/vendorRoutes.js";
import finalOrders from "../routes/finalOrders.js";
import agreementRoutes from "../routes/agreementRoutes.js";
import couponRoutes from "../routes/couponRoutes.js";
import catererPersistenceRoutes from "../routes/reduxRoutes/caterer.js";
import decoratorPersistenceRoutes from "../routes/reduxRoutes/decorator.js";
import makeupArtistPersistenceRoutes from "../routes/reduxRoutes/makeUpArtist.js";
import photographerPersistenceRoutes from "../routes/reduxRoutes/photographers.js";
import venueProviderPersistenceRoutes from "../routes/reduxRoutes/venue-provider.js";
import djArtistPersistenceRoutes from "../routes/reduxRoutes/djArtist.js";
import updatePageRoutes from "../routes/updatePageRoutes.js";
import vendorNotificationRoutes from "../routes/vendorNotificationRoutes.js";
import emNotificationRoutes from "../routes/emNotificationRoutes.js";
import customerNotificationRoutes from "../routes/customerNotificationRoutes.js";
import invoiceRoutes from "../routes/invoiceRoutes.js";
import deviceTokenRoutes from "../routes/deviceTokenRoutes.js";
import whatsappRoutes from "../routes/whatsappRoutes.js";
import notificationApiRoutes from "../routes/notificationApiRoutes.js";

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
router.use("/media", mediaRoutes);

// router.use("/venue", venueRouter);
router.use("/featured-vendors", featuredVendorsRoutes);
router.use("/customer", customerRoutes);
router.use("/contact", contactRoutes);
router.use("/review", reviewRoutes);
router.use("/emadmin", emadminRoutes);
router.use("/sales", salesRoutes);
router.use("/vendors", Vendor);
router.use("/final-orders", finalOrders);
router.use("/agreements", agreementRoutes);
router.use("/coupons", couponRoutes);
router.use("/catering-details", catererPersistenceRoutes);
router.use("/decorator-details", decoratorPersistenceRoutes);
router.use("/makeup-artist-details", makeupArtistPersistenceRoutes);
router.use("/photographer-details", photographerPersistenceRoutes);
router.use("/venue-provider-details", venueProviderPersistenceRoutes);
router.use("/dj-artist-details", djArtistPersistenceRoutes);
// router.use("/business-details", businessDetailsRoutes); Not to be done
router.use("/update-page", updatePageRoutes);
router.use("/vendor-edit", vendorEditRoutes);
router.use("/vendor-notifications", vendorNotificationRoutes);
router.use("/em-notifications", emNotificationRoutes);
router.use("/customer-notifications", customerNotificationRoutes);
router.use("/notifications", notificationApiRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/device-tokens", deviceTokenRoutes);
router.use("/webhook", waRoutes);
router.use("/whatsapp", whatsappRoutes);

return router;
}
