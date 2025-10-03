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
import serviceRouter from "../routes/servicesRoutes.js";
import venueRouter from "../routes/venueRoutes.js";
import featuredVendorsRoutes from "../routes2/featuredVendorsRoutes.js";
import customerRoutes from "../routes2/customerRoutes.js";
import contactRoutes from "../routes2/contactRoutes.js";
import reviewRoutes from "../routes2/reviewRoutes.js";
import chatRoutes from "../routes/chatRoutes.js";
import waRoutes from "../routes/waHooks.js";
import rmadminRoutes from "../routes/rmadminRoutes.js";
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

const MainRoutes = Router();

// // Attach all routes here
MainRoutes.use("/products", productRoutes);
MainRoutes.use("/payment", cashfreeRoutes);
MainRoutes.use("/auth", authRoutes);
MainRoutes.use("/query", queryRoutes);
MainRoutes.use("/email", emailRoutes);
MainRoutes.use("/about-email", aboutEmailRoutes);
MainRoutes.use("/files", fileRoutes);
MainRoutes.use("/quotations", quotationRoutes);
// router.use("/chats", chatRoutes);
MainRoutes.use("/verification", verificationRoutes);
MainRoutes.use("/bookings", BookingRoutes);
// router.use("/service", serviceRouter);
// router.use("/venue", venueRouter);
MainRoutes.use("/featured-vendors", featuredVendorsRoutes);
MainRoutes.use("/customer", customerRoutes);
MainRoutes.use("/contact", contactRoutes);
MainRoutes.use("/review", reviewRoutes);
// router.use("/rmadmin", rmadminRoutes);
MainRoutes.use("/sales", salesRoutes);
// router.use("/vendors", Vendor);
MainRoutes.use("/final-orders", finalOrders);
MainRoutes.use("/agreements", agreementRoutes);
MainRoutes.use("/coupons", couponRoutes);
MainRoutes.use("/catering-details", catererPersistenceRoutes);
MainRoutes.use("/decorator-details", decoratorPersistenceRoutes);
MainRoutes.use("/makeup-artist-details", makeupArtistPersistenceRoutes);
MainRoutes.use("/photographer-details", photographerPersistenceRoutes);
MainRoutes.use("/venue-provider-details", venueProviderPersistenceRoutes);
// MainRoutes.use("/business-details", businessDetailsRoutes); Not to be done
MainRoutes.use("/update-page", updatePageRoutes);
MainRoutes.use("/vendor-edit", vendorEditRoutes);
// router.use("/webhook", waRoutes); 


export default MainRoutes;
