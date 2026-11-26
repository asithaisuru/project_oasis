import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  const testing = process.env.NODE_ENV === 'test' || process.env.EMAIL_MODE === 'stream';
  const transporter = nodemailer.createTransport(testing ? { streamTransport: true, buffer: true, newline: 'unix' } : {
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT || 587) === 465,
    requireTLS: true, tls: { rejectUnauthorized: true }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter.sendMail({ from: testing ? 'Oasis Demo <noreply@example.test>' : process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html, disableFileAccess: true, disableUrlAccess: true });
};
