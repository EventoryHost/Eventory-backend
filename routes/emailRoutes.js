import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  const { fullName, email, message } = req.body;

  try {
    // Create a transporter object using SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail", // You can use different email services
      auth: {
        user: process.env.EMAIL_USER, // Use environment variables to store sensitive data
        pass: process.env.EMAIL_PASS,
      },
    });

    // Setup email data
    let mailOptions = {
      from: `"Eventory" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      cc: `<${process.env.EMAIL_USER}>`,
      subject: `Business Query from ${fullName}`,
      text:
        `You have received a new message from your business query contact form.\n\n` +
        `Name: ${fullName}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email");
  }
});

export default router;
