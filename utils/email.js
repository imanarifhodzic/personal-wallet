import dotenv from "dotenv";
dotenv.config();

// Email is sent via Resend's HTTP API (https://resend.com) instead of SMTP.
// Managed hosts like Render's free tier block outbound SMTP ports (25/465/587),
// which made the old nodemailer+Gmail transport hang and time out in production.
// An HTTPS API call (port 443) is not blocked, so this works both locally and
// on Render with no code differences.
//
// Required env var: RESEND_API_KEY
// Optional env var: EMAIL_FROM  (defaults to Resend's shared testing sender,
//   which can only deliver to your own Resend account email. To send to any
//   parent address, verify a domain in Resend and set EMAIL_FROM to an address
//   on it, e.g. "Personal Wallet <no-reply@yourdomain.com>".)

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = process.env.EMAIL_FROM || "Personal Wallet <onboarding@resend.dev>";
const SEND_TIMEOUT_MS = 10000;

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  // Fail fast instead of hanging forever if the network/API is unreachable.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Email request timed out after ${SEND_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  return res.json();
}

export const sendLinkCode = async (parentEmail, childEmail, code) => {
  console.log(
    "Sending link code to:",
    parentEmail,
    "for child:",
    childEmail,
    "code:",
    code,
  );
  await sendEmail({
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
  await sendEmail({
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
