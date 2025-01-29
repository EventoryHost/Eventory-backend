import mongoose from "mongoose";
import { Service } from "./models/services.js";
const MONGO_URI =
  "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory.0aghroh.mongodb.net/dev?retryWrites=true&w=majority&appName=Eventory"; // Replace with your MongoDB URI

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Failed to connect to MongoDB:", error));

// Dummy data to insert
const dummyServices = [
  {
    id: "1",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 1 description",
    name: "Service 1",
    address: "123 Main St",
    price: "$100",
    type: "Type A",
  },
  {
    id: "2",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 2 description",
    name: "Service 2",
    address: "456 Elm St",
    price: "$200",
    type: "Type B",
  },
  {
    id: "3",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 3 description",
    name: "Service 3",
    address: "789 Oak St",
    price: "$150",
    type: "Type C",
  },
  {
    id: "4",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 4 description",
    name: "Service 4",
    address: "321 Maple St",
    price: "$250",
    type: "Type D",
  },
  {
    id: "5",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 5 description",
    name: "Service 5",
    address: "654 Pine St",
    price: "$300",
    type: "Type A",
  },
  {
    id: "6",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 6 description",
    name: "Service 6",
    address: "987 Birch St",
    price: "$180",
    type: "Type B",
  },
  {
    id: "7",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 7 description",
    name: "Service 7",
    address: "159 Willow St",
    price: "$400",
    type: "Type C",
  },
  {
    id: "8",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 8 description",
    name: "Service 8",
    address: "753 Cedar St",
    price: "$220",
    type: "Type D",
  },
  {
    id: "9",
    photo:
      "https://d1u34m45xfa3ar.cloudfront.net/Photographers/images/1736350806163-jayesh-jalodara-bWQ6-0c_ZcM-unsplash.jpg",
    description: "Service 9 description",
    name: "Service 9",
    address: "951 Spruce St",
    price: "$500",
    type: "Type A",
  },
];

// Insert dummy data
const insertDummyData = async () => {
  try {
    await Service.insertMany(dummyServices);
    console.log("Dummy data inserted successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error inserting dummy data:", error);
    mongoose.connection.close();
  }
};

insertDummyData();
