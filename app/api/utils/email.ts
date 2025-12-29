import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  if (!to) throw new Error("Missing recipient email address.");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Exam Schedule" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
        <h2 style="color:#0070f3;">Reset Your Password</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to choose a new password:</p>
        <p>
          <a href="${resetLink}"
             style="display:inline-block;background:#0070f3;color:white;
             padding:10px 20px;border-radius:5px;text-decoration:none;font-weight:bold;">
             Reset Password
          </a>
        </p>
        <p>If you didn’t request this, please ignore this email.</p>
        <p>— Exam Schedule Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
