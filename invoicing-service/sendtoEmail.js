import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const generateEmailHtml = (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Eventory</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #F9F9F9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #FFFFFF; padding: 30px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center;">
    <img src="https://d5b8uhuzdzhj3.cloudfront.net/assets/logo/Logo.png" alt="Eventory Logo" width="150" style="margin-bottom: 20px;">
    <div style="font-size: 22px; font-weight: bold; color: #333; margin-bottom: 10px;">Welcome to Eventory! 🎉</div>
    <div style="font-size: 16px; color: #555; line-height: 1.6; text-align: left;">
      <p>Dear <strong>${name}</strong>,</p>
      <p>Aapka decision iss platform ko choose karne ka ek <strong>smart aur forward-thinking move</strong> hai — and we truly appreciate it!</p>
      <p>Aapka onboarding complete ho chuka hai, aur iss email ke saath aapka invoice bhi attached hai for your reference.</p>
      <p>We are looking forward to this partnership, and we welcome you to <strong>Eventory</strong>!</p>
      <p>Agar aapko koi sawal ho ya madad chahiye ho, feel free to reach out to us at 
        <a href="tel:+918800725840" style="color: #0a7cff; text-decoration: none;">8800725840</a>.
      </p>
      <p>Also, join our community to get all the Eventory updates and insights. 👇🏼</p>
      <div style="text-align: center;">
        <a href="https://chat.whatsapp.com/Ex0NWMbGNSIHnM2Y1Cg5k2?mode=r_c"
           style="display: inline-block; background-color: #302E81; color: #FFFFFF; padding: 12px 20px; border-radius: 5px; font-size: 16px; text-decoration: none; font-weight: bold; margin-top: 20px;">
          Join WhatsApp Community
        </a>
      </div>
      <p style="margin-top: 30px;">Warm regards,<br><strong>Team Eventory</strong></p>
    </div>
  </div>
</body>
</html>
`;

export async function sendInvoiceEmail({ to, name, pdfBuffer, pdfFileName }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.INVOICING_EMAIL_PASS,
    },
  });

  const slackEmail =
    "event-vendor-onboardi-aaaaqhbbkgsagqwcg6mbxser4a@eventory-hq.slack.com";
  const ccEmails =
    to === slackEmail
      ? ["payments@eventory.in"]
      : [slackEmail, "payments@eventory.in"];

  const mailOptions = {
    from: "registrations@eventory.in",
    to,
    cc: ccEmails,
    subject: "Welcome to Eventory!",
    html: generateEmailHtml(name),
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}
