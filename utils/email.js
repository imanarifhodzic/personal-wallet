import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendLinkCode = async (parentEmail, childEmail, code) => {
  // ... existing code stays here unchanged
};

export const sendVerificationEmail = async (toEmail, token) => {
  await transporter.sendMail({
    from: `"Personal Wallet" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Personal Wallet — Verify your email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #534AB7;">Personal Wallet</h2>
        <p>Thanks for registering. Please verify your email address to activate your account.</p>
        <a href="http://localhost:5174/verify-email?token=${token}" 
           style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: #534AB7; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Verify my email
        </a>
        <p style="color: #888;">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
      </div>
    `,
  });
};
