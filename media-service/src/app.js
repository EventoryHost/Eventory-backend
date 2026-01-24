import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mediaRoutes from "./routes/mediaRoutes.js";

dotenv.config({ path: ".env" });
const app = express();

app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
}));

app.use("/media", mediaRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Media service running on port ${PORT}`));
