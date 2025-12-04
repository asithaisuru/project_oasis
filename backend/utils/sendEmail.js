// backend/utils/emailService.js
import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  try {
    // Use the same configuration as your payment system
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"Oasis Institute of Higher Education" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log("📧 Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    
    // Don't throw the error - just log it and continue
    // This way grade publishing still works even if email fails
    console.log("⚠️ Continuing without email...");
    return { 
      success: false, 
      error: error.message,
      message: 'Email failed but grade published'
    };
  }
};