import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Ensure environment variables are loaded even when this runs standalone
dotenv.config({ path: "./.env" });

// Verify that credentials are actually loaded
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("GMAIL_PASS:", process.env.GMAIL_PASS ? "(loaded)" : "(missing)");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Send email verification link through Gmail SMTP.
export async function sendVerificationEmail(to: string, token: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;

  const subject = "Verify your email - Exam Schedule Platform";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="color: #2563eb;">Exam Schedule Platform</h2>
      <p>Hello,</p>
      <p>Thank you for signing up! Please verify your email by clicking the button below:</p>
      <p style="margin: 20px 0;">
        <a href="${verifyUrl}" 
           style="background: #2563eb; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      </p>
      <p>If the button doesn’t work, copy and paste this link in your browser:</p>
      <p style="color:#2563eb;">${verifyUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>– Exam Schedule Team</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Exam Schedule" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Verification email sent to ${to}`);
    console.log("Gmail SMTP response:", info);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}
