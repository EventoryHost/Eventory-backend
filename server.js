import "dotenv/config.js";
import express, { json } from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import color from "chalk";

const app = express();
const port = 3000;

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
    `Server listening on port ${color.blueBright("http://localhost:" + port)}`
  );
});
