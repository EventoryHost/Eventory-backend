import "dotenv/config.js";
import { connect } from "mongoose";
import chalk from "chalk";

const connectDB = async () => {
  try {
    await connect(
      "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory.0aghroh.mongodb.net/dev?retryWrites=true&w=majority&appName=Eventory",
    );
    console.log(chalk.greenBright("MongoDB connected..."));
  } catch (err) {
    console.error(chalk.redBright(err.message));
    process.exit(1);
  }
};

export default connectDB;
