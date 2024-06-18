const express = require("express");
const connectDB = require("./config/db.js");
const cors = require("cors");
require("dotenv").config();
const AWS = require('aws-sdk')

const app = express();
const port = 3000;

connectDB();

AWS.config.update({
  region: process.env.AWS_REGION
})

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);

app.use("/api/products", require("./routes/productRoutes"));
app.use('/auth', require('./routes/authRoutes'));


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
