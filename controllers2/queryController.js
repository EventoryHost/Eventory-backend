import Query from "../models/query.js";
import nodemailer from "nodemailer";
import "dotenv/config";

const createQuery = async (req, res) => {
  try {
    const { fullName, email, message, services, city } = req.body;

    const query = new Query({
      fullname: fullName || "User",
      email,
      services,
      city,
      message,
    });

    const newQuery = await query.save();

    if (!newQuery)
      return res.status(500).json({ error: "Error While Creating Query" });

    // Setup nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email HTML templates
    const supportEmailBody = `
    <!DOCTYPE html>
    <html>
      <head>...</head> <!-- same style as in your original code -->
      <body>
        <div class="email-container">
          <div class="header">New Business Query Received</div>
          <div class="content">
            <p><strong>Sender's Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Services:</strong> ${services.join(", ")}</p>
            <p><strong>City:</strong> ${city}</p>
            <div class="message-box"><p>${message}</p></div>
            <p>This is an automated notification of a new business query.</p>
          </div>
          <div class="footer">&copy; 2024 Eventory | <a href="mailto:vendor-support@eventory.in">Contact Support</a></div>
        </div>
      </body>
    </html>
    `;

    const userEmailBody = `
    <!DOCTYPE html>
    <html>
      <head>...</head> <!-- same style as in your original code -->
      <body>
        <div class="email-container">
          <div class="header">Thank You for Your Query!</div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>We have received your message and will get back to you shortly.</p>
            <p><strong>Phone:</strong> +91 8800725840</p>
            <div class="message-box"><p>${message}</p></div>
            <p>Thank you for your interest in Eventory!</p>
          </div>
          <div class="footer">&copy; 2024 Eventory | <a href="mailto:vendor-support@eventory.in">Contact Us</a></div>
        </div>
      </body>
    </html>
    `;

    // Send email to support
    await transporter.sendMail({
      from: `"Eventory Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      cc: process.env.EMAIL_USER,
      subject: `New Business Query from ${fullName}`,
      html: supportEmailBody,
    });

    // Send thank-you email to user
    await transporter.sendMail({
      from: `"Eventory Support" <${process.env.RECEIVER_EMAIL}>`,
      to: email,
      subject: "Thank You for Your Query",
      html: userEmailBody,
    });

    return res.status(200).json(newQuery);
  } catch (error) {
    console.error("Error in createQuery:", error);
    return res.status(500).json({ error: error.message });
  }
};

const createreachoutQuery = async (req, res) => {
  try {
    const { fullName, mobileno, message } = req.body;

    const query = new reactoutQuery({
      fullName,
      mobileno,
      message,
    });

    const newQuery = await query.save();

    if (!newQuery)
      return res.status(500).json({ error: "Error While Createing Quary" });
    // console.log(newQuery)
    return res.status(200).json(newQuery);
  } catch (error) {
    // console.log(error)
    return res.status(500).json({ error: error.message });
  }
};

export default { createQuery, createreachoutQuery };
