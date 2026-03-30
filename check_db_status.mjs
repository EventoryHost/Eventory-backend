import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://eventorycareers:PbnzJIyRlyJXCyRC@migrate.3upxz3t.mongodb.net/dev?retryWrites=true&w=majority&appName=Eventory";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to dev DB");

    const orderId = "ODR300320261313335864B312E";
    const db = mongoose.connection.db;

    const order = await db.collection('orders').findOne({ order_id: orderId });
    console.log("Order Status:", order ? "Found" : "Not Found");
    if (order) {
      console.log("Order details (simplified):", {
        order_id: order.order_id,
        quotation_id: order.quotation_id,
        event_id: order.event_id,
        order_status: order.order_status
      });
    }

    const eventByOrderId = await db.collection('events').findOne({ order_id: orderId });
    console.log("Event by order_id:", eventByOrderId ? "Found" : "Not Found");

    const quotationId = "STND_1774856540288";
    const eventByQuote = await db.collection('events').findOne({ quotation_id: quotationId });
    console.log("Event by quotation_id:", eventByQuote ? "Found" : "Not Found");
    if (eventByQuote) {
      console.log("Event details by quote_id (simplified):", {
        event_id: eventByQuote.event_id,
        customer_id: eventByQuote.customer_id,
        vendor_id: eventByQuote.vendor_id
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
