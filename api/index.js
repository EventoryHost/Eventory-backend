import "dotenv/config.js";
import express, { json } from "express";
import connectDB from "../config/db.js";
import cors from "cors";
import productRoutes from "../routes/productRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import router from "../routes/authRoutes.js";
import chalk from "chalk";
import morgan from "morgan";
import router from "./routes/authRoutes.js";

const app = express();
const port = 4000;
app.use(morgan("dev"));

connectDB();

app.use(json());
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  }),
);
app.use("/", router);
app.use("/api/products", productRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(201).send("Eventory APIs are running...");
});

app.listen(port, () => {
  console.log(
    "Server listening on port " + chalk.blueBright("http://localhost:" + port),
  );
});

export default app;
