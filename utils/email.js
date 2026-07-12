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
  console.log(
    "Sending link code to:",
    parentEmail,
    "for child:",
    childEmail,
    "code:",
    code,
  );
  await transporter.sendMail({
    from: `"Personal Wallet" <${process.env.EMAIL_USER}>`,
    to: parentEmail,
    subject: "Personal Wallet — Account linking request",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #534AB7;">Personal Wallet</h2>
        <p>A child account is being created and wants to link to your Personal Wallet account.</p>
        <p><strong>Child email:</strong> ${childEmail}</p>
        <p>Their one-time verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #534AB7; padding: 20px; background: #EEEDFE; border-radius: 8px; text-align: center; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #888;">This code expires in 15 minutes. If you did not expect this request, ignore this email.</p>
      </div>
    `,
  });
  console.log("Link code email sent successfully");
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
