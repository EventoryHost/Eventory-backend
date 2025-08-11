import "dotenv/config.js";
import express, { Router } from "express";
import connectDB from "../config/db.js";
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import { handleSocketConnection } from "../controllers2/chatController.js";
import dotenv from "dotenv";
dotenv.config();

// Migration Route Imports for testing
import vendorRoutes from "../routes2/vendorRoutes.js";
import servicesRoutes from "../routes2/servicesRoutes.js";
import customerRoutes from "../routes2/customerRoutes.js";
import calendarRoutes from "../routes2/calendarRoutes.js";
import customerNotificationRoutes from "../routes2/customerNotificationRoutes.js";
import eventsRoutes from "../routes2/eventsRoutes.js";
import invoicesRoutes from "../routes2/invoicesRoutes.js";
import chatRoutes from "../routes2/chatRoutes.js";
import reviewsRoutes from "../routes2/reviewsRoutes.js";
import messageRoutes from "../routes2/messageRoutes.js";
import businessQueryRoutes from "../routes2/businessQueryRoutes.js";

// New controller routes
import ordersRoutes from "../routes2/ordersRoutes.js";
import eventManagerRoutes from "../routes2/eventManagerRoutes.js";
import salesExecutiveRoutes from "../routes2/salesExecutiveRoutes.js";
import promotionsRoutes from "../routes2/promotionsRoutes.js";
import couponsRoutes from "../routes2/couponsRoutes.js";
import businessDetailsRoutes from "../routes2/businessDetailsRoutes.js";
import bankDetailsRoutes from "../routes2/bankDetailsRoutes.js";

const app = express();
const port = process.env.PORT || 4001; // Use different port for migration testing
const router = Router();

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
  console.log("🟢 Migration Server - New client connected:", socket.id);
  handleSocketConnection(socket, io);
});

app.use(morgan("dev"));

// Connect to the new migration database
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
// Migration routes
app.use("/", router);
app.use("/api/vendor", vendorRoutes);
app.use("/api/", servicesRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/customer-notifications", customerNotificationRoutes);
app.use("/api/business-queries", businessQueryRoutes);

// New routes
app.use("/api/orders", ordersRoutes);
app.use("/api/event-managers", eventManagerRoutes);
app.use("/api/sales-executives", salesExecutiveRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/business-details", businessDetailsRoutes);
app.use("/api/bank-details", bankDetailsRoutes);

app.get("/", (req, res) => {
  res.status(201).send("Eventory Migration APIs are running...");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Migration API is healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

server.listen(port, () => {
  console.log(
    "🚀 Migration Server listening on " + chalk.greenBright(`http://localhost:${port}`),
  );
  console.log(
    "📊 Migration Database: " + chalk.yellowBright("Connected to new MONGO_URI"),
  );
});

export default app;
