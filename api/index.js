import "dotenv/config.js";
import express, { Router, json } from "express";
import connectDB from "../config/db.js";
import cors from "cors";
import productRoutes from "../routes/productRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import emailRoutes from "../routes/emailRoutes.js";
import aboutEmailRoutes from "../routes/aboutEmailRoutes.js";
import chalk from "chalk";
import morgan from "morgan";
import razorpayRoutes from "../routes/razorpayRoutes.js";
import queryRoutes from "../routes/queryRoutes.js";
import fileRoutes from "../routes/fileRoutes.js";
import venueQuotation from "../models/venueQuotation.js";

const app = express();
const port = 4000;
const router = Router();

app.use(morgan("dev"));

connectDB();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin",
    credentials: true,
  }),
);
app.use("/", router);
app.use("/api/products", productRoutes);
app.use("/api/payment", razorpayRoutes);
app.use("/auth", authRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/about-email", aboutEmailRoutes);
app.use("/api/files", fileRoutes);

// Create a new quotation
app.post('/api/quotations', async (req, res) => {
  try {
    const newQuotation = new venueQuotation({
      event_name: req.body.event_name,
      number_of_guest: req.body.number_of_guest,
      date: req.body.date,
      time: req.body.time,
      budget: req.body.budget,
      requirements: req.body.requirements,
      user_id: req.body.user_id,
      user_name: req.body.user_name,
      vendor_id: req.body.vendor_id 
    });

    // Save the document to MongoDB
    const savedQuotation = await newQuotation.save();

    // Send a response back to the client
    res.status(201).json({
      message: 'Quotation created successfully!',
      data: savedQuotation
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating quotation',
      error: error.message
    });
  }
});

// get quotations by vendor id
app.get('/api/quotations', async (req, res) => {
  try {
    const { vendor_id } = req.query;  // Get the vendor_id from the query parameters

    // Ensure vendor_id is provided
    if (!vendor_id) {
      return res.status(400).json({
        message: "vendor_id is required"
      });
    }

    // Query the database to find all quotations with the given vendor_id
    const quotations = await venueQuotation.find({ vendor_id });

    // If no quotations are found, return a 404 response
    if (quotations.length === 0) {
      return res.status(404).json({
        message: `No quotations found for vendor_id: ${vendor_id}`
      });
    }

    // Send the found quotations back to the client
    res.status(200).json({
      message: 'Quotations retrieved successfully!',
      data: quotations
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving quotations',
      error: error.message
    });
  }
});




app.get("/", (req, res) => {
  res.status(201).send("Eventory APIs are running...");
});

app.listen(port, () => {
  console.log(
    "Server listening on port " + chalk.blueBright("http://localhost:" + port),
  );
});

export default app;
