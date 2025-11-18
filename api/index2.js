import "dotenv/config.js";
import express, { Router } from "express";
import connectDB from "../config/db.js";
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import MainRoutes from "../routes2/routes.js";
import { handleSocketConnection } from "../controllers2/chatController.js";

import authRoutes from "../routes2/authRoutes.js";
import productRoutes from "../routes2/productRoutes.js";
import { businessDetailsRoutes } from "../routes2/reduxRoutes/businessDetails.js";
import caterer from "../routes2/reduxRoutes/caterer.js";
import verificationRoutes from "../routes2/verificationRoutes.js";
import decorator from "../routes2/reduxRoutes/decorator.js";
import { initializeWorkers } from "../utils/notificationScheduler.js";
dotenv.config();

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

io.on("connection", (socket) => handleSocketConnection(socket, io));

app.use(morgan("dev"));

// Connect to the new migration database
connectDB();

// 🔥 START THE BACKGROUND NOTIFICATION WORKER
// This starts the 30-minute timer for checking unread chats.
initializeWorkers();

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
app.use("/api", MainRoutes(io));


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
