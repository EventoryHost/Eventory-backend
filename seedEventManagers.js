import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import EventManager from "./models2/eventManager.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ventory";

const ems = [
  {
    user_name: "keshavkrishna",
    contact_name: "Keshav Krishna",
    contact_number: "9876543210",
    yoe: "3",
    number_of_events_exp: "25",
    doj: new Date("2023-02-15"),
    password: "KeshavKrishna_123",
  },
  {
    user_name: "krishnabharti",
    contact_name: "Krishna Bharti",
    contact_number: "9123456789",
    yoe: "2",
    number_of_events_exp: "18",
    doj: new Date("2023-06-01"),
    password: "KrishnaBharti_123",
  },
  {
    user_name: "mohitgupta",
    contact_name: "Mohit Gupta",
    contact_number: "9988776655",
    yoe: "4",
    number_of_events_exp: "32",
    doj: new Date("2022-11-10"),
    password: "MohitGupta_123",
  },
];

async function seedEventManagers() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    for (const em of ems) {
      // 🔒 Hash password before saving
      const hashedPassword = await bcrypt.hash(em.password, 10);

      const newEM = new EventManager({
        user_name: em.user_name,
        password: hashedPassword,
        contact_name: em.contact_name,
        contact_number: em.contact_number,
        yoe: em.yoe,
        number_of_events_exp: em.number_of_events_exp,
        doj: em.doj,
      });

      await newEM.save();
      console.log(`✅ Saved ${em.contact_name}`);
    }

    console.log("🎉 All Event Managers inserted successfully!");
  } catch (err) {
    console.error("❌ Error inserting Event Managers:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB connection closed");
  }
}

seedEventManagers();
