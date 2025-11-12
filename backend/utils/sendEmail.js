import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  // 1. Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // e.g., "smtp.gmail.com"
    port: process.env.SMTP_PORT || 587,
    secure: false,                     // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,    
      pass: process.env.SMTP_PASS   
    }
  });

  // 2. Send mail
  const info = await transporter.sendMail({
    from: `"Oasis Institute of Higher Education" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });

  console.log("Message sent: %s", info.messageId);
};
