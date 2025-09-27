import nodemailer from "nodemailer";

/**
 * Controller: Send contact inquiry email
 */
export const sendContactEmail = async (req, res) => {
  const { fullName, mobileNumber, eventType, message } = req.body;

  if (!fullName || !mobileNumber || !eventType || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Inquiry</title>
          <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
              .email-container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
              .header { background-color: #2e3192; color: #fff; text-align: center; padding: 15px; font-size: 20px; }
              .content { padding: 20px; color: #333; }
              .footer { background-color: #2e3192; color: #fff; text-align: center; padding: 10px; font-size: 14px; }
              .message-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin-top: 20px; border-radius: 4px; }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">New Contact Inquiry</div>
              <div class="content">
                  <p><strong>Name:</strong> ${fullName}</p>
                  <p><strong>Mobile:</strong> ${mobileNumber}</p>
                  <p><strong>Event Type:</strong> ${eventType}</p>
                  <p><strong>Message:</strong></p>
                  <div class="message-box">${message}</div>
              </div>
              <div class="footer">
                  &copy; 2025 Eventory | <a href="mailto:support@eventory.in" style="color: #fff;">Contact Support</a>
              </div>
          </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Eventory Support" <${process.env.EMAIL_USER}>`,
      to: "support@eventory.in",
      subject: `New Contact Inquiry from ${fullName}`,
      html: emailBody,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};
