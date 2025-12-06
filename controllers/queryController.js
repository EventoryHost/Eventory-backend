import nodemailer from "nodemailer";
import "dotenv/config";
import BusinessQuery from "../models/businessQuery.js";

const normalizeServices = (services) => {
  if (!services) return [];
  if (Array.isArray(services)) return services.filter(Boolean).map(String);
  return String(services)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// POST /create-query  -> general customer query
export const createQuery = async (req, res) => {
  try {
    const { fullName, email, message, services, city } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const doc = new BusinessQuery({
      query_type: "customer_query",
      sender_name: fullName || "User",
      sender_email: email || undefined,
      sender_services: normalizeServices(services),
      sender_city: city || undefined,
      business_query: message,
    });

    const newQuery = await doc.save();

    // Optional notifications (kept from your draft)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const supportEmailBody = `
        <!DOCTYPE html>
        <html><body>
          <h3>New Business Query Received</h3>
          <p><strong>Sender's Name:</strong> ${fullName || "User"}</p>
          <p><strong>Email:</strong> ${email || "N/A"}</p>
          <p><strong>Services:</strong> ${normalizeServices(services).join(", ") || "N/A"}</p>
          <p><strong>City:</strong> ${city || "N/A"}</p>
          <p><strong>Message:</strong> ${message}</p>
        </body></html>
      `;

      const userEmailBody = `
        <!DOCTYPE html>
        <html><body>
          <h3>Thank You for Your Query!</h3>
          <p>Dear <strong>${fullName || "User"}</strong>,</p>
          <p>We have received your message and will get back to you shortly.</p>
          <p><strong>Phone:</strong> +91 8800725840</p>
          <p><strong>Your Message:</strong> ${message}</p>
        </body></html>
      `;

      if (process.env.RECEIVER_EMAIL && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"Eventory Notifications" <${process.env.EMAIL_USER}>`,
          to: process.env.RECEIVER_EMAIL,
          cc: process.env.EMAIL_USER,
          subject: `New Business Query from ${fullName || "User"}`,
          html: supportEmailBody,
        });

        if (email) {
          await transporter.sendMail({
            from: `"Eventory Support" <${process.env.RECEIVER_EMAIL}>`,
            to: email,
            subject: "Thank You for Your Query",
            html: userEmailBody,
          });
        }
      }
    } catch (mailErr) {
      // Do not fail the request if email fails
      console.warn("Email send failed:", mailErr?.message);
    }

    // Keep 201 for general “create-query”
    return res.status(201).json(newQuery);
  } catch (error) {
    console.error("Error in createQuery:", error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /create-reachout-query -> business/partner reachout
export const createreachoutQuery = async (req, res) => {
  try {
    const { fullName, mobileno, message, email, company, services, city } = req.body;

    if (!fullName || !mobileno || !message) {
      return res.status(400).json({ error: "fullName, mobileno and message are required" });
    }

    // Basic mobile validation (10+ digits typical for India)
    const digits = String(mobileno).replace(/\D/g, "");
    if (digits.length < 10) {
      return res.status(400).json({ error: "Invalid mobile number" });
    }

    const doc = new BusinessQuery({
      query_type: "business_query",
      sender_name: fullName,
      sender_contact_number: mobileno,
      sender_email: email || undefined,
      sender_city: city || undefined,
      business_query: message,
    });

    const newQuery = await doc.save();

    // For reachout, returning 200 matches current frontend expectation
    return res.status(200).json(newQuery);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { createQuery, createreachoutQuery };
