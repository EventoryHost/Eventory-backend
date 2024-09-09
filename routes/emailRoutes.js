import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
    const { fullName, email, message, services, city } = req.body;

    try {

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        let supportEmailBody = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Business Query Received</title>
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
              font-size: 20px;
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
              New Business Query Received
          </div>
          <div class="content">
              <p><strong>Sender's Name:</strong> ${fullName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Services:</strong> ${services.join(", ")}</p>
              <p><strong>City:</strong> ${city}</p>
              <p><strong>Message Details:</strong></p>
              <div class="message-box">
                  <p>${message}</p>
              </div>
              <p>This is an automated notification of a new business query. Please review and respond as necessary.</p>
          </div>
          <div class="footer">
              &copy; 2024 Eventory | <a href="mailto:vendor-support@eventory.in">Contact Support</a>
          </div>
      </div>
  </body>
  </html>
`;

        // Email to Eventory support
        let supportMailOptions = {
            from: `"Eventory Notifications" <${process.env.EMAIL_USER}>`,
            to: process.env.RECEIVER_EMAIL, // Internal support email
            cc: `<${process.env.EMAIL_USER}>`, // CC to own account
            subject: `New Business Query from ${fullName}`,
            html: supportEmailBody, // HTML content
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
            to: email,
            subject: "Thank You for Your Query",
            html: userEmailBody,
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
