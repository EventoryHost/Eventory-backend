import "dotenv/config.js";
import express, { json } from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chalk from "chalk";
import morgan from "morgan";

const app = express();
const port = 3000;
app.use(morgan("dev"));

connectDB();

app.use(json());
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);

app.use("/api/products", productRoutes);
app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(
    "Server listening on port " + chalk.blueBright("http://localhost:" + port)
  );
});

export default app;
