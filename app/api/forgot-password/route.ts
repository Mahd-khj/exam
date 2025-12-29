import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeDatabase } from "@/backend/db-init";
import User from "@/backend/models/User";
import { sendPasswordResetEmail } from "../utils/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("📩 Forgot-password request for:", email);

    await initializeDatabase();

    // ✅ Step 1: Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.warn(`⚠️ No account found for ${email}`);
      return NextResponse.json({
        success: true,
        message:
          "If that email exists, a password reset link has been sent (for security).",
      });
    }

    // ✅ Step 2: Generate token and expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // ✅ Step 3: Update using direct query (ensures persistence)
    await User.update(
      {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
      { where: { email } }
    );

    console.log(`💾 Token updated in DB for: ${email}`);

    // ✅ Step 4: Confirm saved correctly
    const updatedUser = await User.findOne({ where: { email } });
    console.log("🔍 DB check token:", updatedUser?.getDataValue("resetPasswordToken"));

    if (!updatedUser?.getDataValue("resetPasswordToken")) {
      throw new Error("Failed to persist resetPasswordToken in database");
    }

    // ✅ Step 5: Build reset link
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      email
    )}`;

    // ✅ Step 6: Send email (or log fallback)
    try {
      await sendPasswordResetEmail(email, resetLink);
      console.log(`📧 Password reset email sent to ${email}`);
    } catch (err: any) {
      console.error("⚠️ Email sending failed:", err.message);
      console.log(`🔗 Fallback link: ${resetLink}`);
    }

    return NextResponse.json({
      success: true,
      message:
        "If that email exists, a password reset link has been sent to it.",
    });
  } catch (error: any) {
    console.error("❌ Forgot Password Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
