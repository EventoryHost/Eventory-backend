import { Router } from "express";

// Import all your route files here
import productRoutes from "../routes2/productRoutes.js";
import authRoutes from "../routes2/authRoutes.js";
import emailRoutes from "../routes/emailRoutes.js";
import aboutEmailRoutes from "../routes2/aboutEmailRoutes.js";
import cashfreeRoutes from "../routes/cashfreeRoutes.js";
import queryRoutes from "../routes/queryRoutes.js";
import { businessDetailsRoutes } from "../routes/reduxRoutes/businessDetails.js";
import updatePageRoutes from "../routes/updatePageRoutes.js";
import fileRoutes from "../routes/fileRoutes.js";
import quotationRoutes from "../routes/quotationRoutes.js";
import verificationRoutes from "../routes/verificationRoutes.js";
import BookingRoutes from "../routes/bookingRoutes.js";
import vendorEditRoutes from "../routes/vendorEditRoutes.js";
import serviceRouter from "../routes/servicesRoutes.js";
import venueRouter from "../routes/venueRoutes.js";
import featuredVendorsRoutes from "../routes/featuredVendorsRoutes.js";
import customerRoutes from "../routes/customerRoutes.js";
import contactRoutes from "../routes/contactRoutes.js";
import reviewRoutes from "../routes/reviewRoutes.js";
import chatRoutes from "../routes/chatRoutes.js";
import waRoutes from "../routes/waHooks.js";
import rmadminRoutes from "../routes/rmadminRoutes.js";
import salesRoutes from "../routes/salesRoutes.js";
import Vendor from "../routes/vendorRoutes.js";
import finalOrders from "../routes/finalOrders.js";
import agreementRoutes from "../routes/agreementRoutes.js";
import couponRoutes from "../routes2/couponRoutes.js";

const MainRoutes = Router();

// // Attach all routes here
MainRoutes.use("/products", productRoutes);
// router.use("/payment", cashfreeRoutes);
MainRoutes.use("/auth", authRoutes);
// router.use("/auth", authRoutes);
// router.use("/query", queryRoutes);
// router.use("/email", emailRoutes);
MainRoutes.use("/about-email", aboutEmailRoutes);
// router.use("/files", fileRoutes);
// router.use("/quotations", quotationRoutes);
// router.use("/chats", chatRoutes);
// router.use("/verification", verificationRoutes);
// router.use("/bookings", BookingRoutes);
// router.use("/service", serviceRouter);
// router.use("/venue", venueRouter);
// router.use("/featured-vendors", featuredVendorsRoutes);
// router.use("/customer", customerRoutes);
// router.use("/contact", contactRoutes);
// router.use("/review", reviewRoutes);
// router.use("/rmadmin", rmadminRoutes);
// router.use("/sales", salesRoutes);
// router.use("/vendors", Vendor);
// router.use("/final-orders", finalOrders);
// router.use("/agreements", agreementRoutes);
MainRoutes.use("/coupons", couponRoutes);
// router.use("/business-details", businessDetailsRoutes);
// router.use("/update-page", updatePageRoutes);
// router.use("/vendor-edit", vendorEditRoutes);
// router.use("/webhook", waRoutes); 


export default MainRoutes;
