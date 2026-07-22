import "dotenv/config.js";
import express, { Router } from "express";
import connectDB from "../config/db.js";
import initializeFirebase from "../config/firebaseConfig.js";
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import MainRoutes from "../routes/routes.js";
import { handleSocketConnection } from "../controllers/chatController.js";
import { initializeWorkers } from "../utils/notificationScheduler.js";
import { seedRedirectConfig } from "../models/redirect.js";
import authRoutes from "../routes/authRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import { businessDetailsRoutes } from "../routes/reduxRoutes/businessDetails.js";
import caterer from "../routes/reduxRoutes/caterer.js";
import verificationRoutes from "../routes/verificationRoutes.js";
import decorator from "../routes/reduxRoutes/decorator.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger.js";

import "../utils/paymentReminderCron.js";

dotenv.config();

const app = express();

const port = process.env.PORT || 4000;
const router = Router();

// HTTP server and Socket.IO server setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow all origins for development
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true,
});

io.on("connection", (socket) => {
  console.log(
    `🧠 Socket connected: ${socket.id} (Transport: ${socket.conn.transport.name})`,
  );
  handleSocketConnection(socket, io);
});

app.use(morgan("dev"));

// Connect to database
connectDB().then(() => {
  // Creates the QR redirect config document if it doesn't exist yet.
  seedRedirectConfig();
});
// 🔥 START THE BACKGROUND NOTIFICATION WORKER
// This starts the 30-minute timer for checking unread chats.
initializeWorkers();

// initializeFirebase();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

app.use("/", router);
app.use("/api", MainRoutes(io));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.status(201).send("Eventory APIs are running...");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

server.listen(port, () => {
  console.log(
    "🚀 Server listening on " + chalk.blueBright(`http://localhost:${port}`),
  );
  console.log("📊 Database: " + chalk.yellowBright("Connected"));
});

export default app;
