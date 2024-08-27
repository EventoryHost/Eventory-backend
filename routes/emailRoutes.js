import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  const { fullName, email, message } = req.body;

  try {
    // Create a transporter object using SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email to Eventory support
    let supportMailOptions = {
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

    
    // Send email to Eventory support
    await transporter.sendMail(supportMailOptions);

    // Email to user
    let userEmailBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Your Query</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background-color: #2e3192;
                  color: #ffffff;
                  padding: 20px;
                  text-align: center;
                  font-size: 24px;
              }
              .content {
                  padding: 20px;
                  color: #333333;
              }
              .footer {
                  background-color: #2e3192;
                  color: #ffffff;
                  text-align: center;
                  padding: 10px;
                  font-size: 14px;
              }
              .footer a {
                  color: #ffffff;
                  text-decoration: none;
                  font-weight: bold;
              }
              .message-box {
                  background-color: #f9f9f9;
                  border: 1px solid #dddddd;
                  padding: 15px;
                  margin-top: 20px;
                  border-radius: 4px;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  Thank You for Your Query!
              </div>
              <div class="content">
                  <p>Dear <strong>${fullName}</strong>,</p>
                  <p>Thank you so much for reaching out to us. We have received your message and someone from our team will get back to you shortly.</p>
                  <p>In the meantime, if you have any urgent queries, please feel free to contact us at:</p>
                  <p><strong>Phone:</strong> +91 8800725840</p>
                  <p>Here's a copy of the message you sent us:</p>
                  <div class="message-box">
                      <p><strong>Your Message:</strong></p>
                      <p>${message}</p>
                  </div>
                  <p>Thank you for your interest in Eventory! We look forward to assisting you.</p>
              </div>
              <div class="footer">
                  &copy; 2024 Eventory | <a href="mailto:vendor-support@eventory.in">Contact Us</a>
              </div>
          </div>
      </body>
      </html>
    `;

    let userMailOptions = {
      from: `"Eventory Support" <${process.env.RECEIVER_EMAIL}>`,
      to: email, // Send to the user's email
      cc :"sumit182003@gmail.com",
      subject: 'Thank You for Your Query',
      html: userEmailBody, // Set the HTML body
    };

    // Send email to the user
    await transporter.sendMail(userMailOptions);

    res.status(200).send("Emails sent successfully");
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).send("Failed to send emails");
  }
    
});

export default router;
