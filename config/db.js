import "dotenv/config.js";
import { connect } from "mongoose";

const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI_DEV);
    console.log("MongoDB connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
