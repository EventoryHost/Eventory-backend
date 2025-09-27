import nodemailer from "nodemailer";

export const sendAboutEmail = async (req, res) => {
  const { fullName, phone, message } = req.body;

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let aboutPageEmailBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Query from About Page</title>
          <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
              .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff;
                  border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
              .header { background-color: #2e3192; color: #ffffff; padding: 20px; text-align: center; font-size: 20px; }
              .content { padding: 20px; color: #333333; }
              .footer { background-color: #2e3192; color: #ffffff; text-align: center; padding: 10px; font-size: 14px; }
              .footer a { color: #ffffff; text-decoration: none; font-weight: bold; }
              .message-box { background-color: #f9f9f9; border: 1px solid #dddddd; padding: 15px; margin-top: 20px; border-radius: 4px; }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">New Query from About Page</div>
              <div class="content">
                  <p><strong>Sender's Name:</strong> ${fullName}</p>
                  <p><strong>Phone:</strong> ${phone}</p>
                  <p><strong>Message Details:</strong></p>
                  <div class="message-box"><p>${message}</p></div>
              </div>
              <div class="footer">
                  &copy; 2024 Eventory | <a href="mailto:support@eventory.in">Contact Support</a>
              </div>
          </div>
      </body>
      </html>
    `;

    let supportMailOptions = {
      from: `"Eventory Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New About Page Query from ${fullName}`,
      html: aboutPageEmailBody,
    };

    await transporter.sendMail(supportMailOptions);

    res.status(200).send("About Page Email Sent Successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email");
  }
};
