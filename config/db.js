import "dotenv/config.js";
import { connect } from "mongoose";
import chalk from "chalk";

const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI_DEV);
    console.log(chalk.greenBright("MongoDB connected..."));
  } catch (err) {
    console.error(chalk.redBright(err.message));
    process.exit(1);
  }
};

export default connectDB;
