import mongoose from "mongoose";
import { Booking } from "./models/bookings.js";

mongoose
  .connect(
    "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory.0aghroh.mongodb.net/dev?retryWrites=true&w=majority&appName=Eventory",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

async function createBooking() {
  const newBooking = new Booking({
    venId: "ven20241024155014318",
    serviceId: "ser20241024160813544",
    type: "Event2",
    location: "City Center2",
    startDate: new Date("2024-11-01T10:00:00"),
    endDate: new Date("2024-11-01T18:00:00"),
    details: "Corporate annual event2",
    guest: 400,
    amount: "2000",
    managerName: "Bob",
    description: "A corporate event with networking and workshops and food",
    paymentDetails: "Shop Transfer",
    paymentStatus: "Pending",
    capacity: "300",
  });

  try {
    await newBooking.save();
    console.log("Booking created with bookingid:", newBooking.bookingid);
  } catch (error) {
    console.error("Error creating booking:", error);
  } finally {
    mongoose.connection.close(); // Close the connection after creating the booking
  }
}

createBooking();
