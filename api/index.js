import "dotenv/config.js";
import express, { Router } from "express";
import connectDB from "../config/db.js";
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import { handleSocketConnection } from "../controllers/chatController.js";
import dotenv from "dotenv";
dotenv.config();

// Route Imports
import productRoutes from "../routes/productRoutes.js"; // This includes bank-details
import authRoutes from "../routes/authRoutes.js";
import emailRoutes from "../routes/emailRoutes.js";
import aboutEmailRoutes from "../routes/aboutEmailRoutes.js";
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
import couponRoutes from "../routes/couponRoutes.js"; 
import mediaRoutes from "../routes/mediaRoutes.js";

const app = express();
const port = process.env.PORT;
const router = Router();

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger.js";

// HTTP server and Socket.IO server setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);
  handleSocketConnection(socket, io);
});

app.use(morgan("dev"));

connectDB();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Access-Control-Allow-Origin",
    ],
    exposedHeaders: ["Authorization"],
  }),
);

app.options("/api/business-details/:userId", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

// Add your routes here
app.use("/", router);
app.use("/api", businessDetailsRoutes); // Redux routes for consistency feature
app.use("/api", updatePageRoutes); // Route to update page number in consistency feature
app.use("/api", vendorEditRoutes); // Route to update vendor details
app.use("/api/products", productRoutes); // Handles the product and bank details routes
app.use("/api/payment", cashfreeRoutes);
app.use("/auth", authRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/about-email", aboutEmailRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/quotations", quotationRoutes(io));
app.use("/api/chats", chatRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/Bookings", BookingRoutes);
app.use("/api/service", serviceRouter);
app.use("/api/venue", venueRouter);
app.use("/api", featuredVendorsRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/review", reviewRoutes);
app.use("/webhook", waRoutes);  
app.use("/api", rmadminRoutes);
app.use("/api", salesRoutes);
app.use("/api/vendors", Vendor);
app.use("/api", finalOrders);
app.use("/api/agreements", agreementRoutes);
app.use("/api/coupons", couponRoutes); 
app.use("/api/media", mediaRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.get("/", (req, res) => {
  res.status(201).send("Eventory APIs are running...");
});

server.listen(port, () => {
  console.log(
    "🚀 Server listening on " + chalk.blueBright(`http://localhost:${port}`),
  );
});

export default app;
