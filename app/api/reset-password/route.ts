import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initializeDatabase } from "@/backend/db-init";
import User from "@/backend/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    await initializeDatabase();

    // Find user by token and email
    const user = await User.findOne({ where: { email, resetPasswordToken: token } });

    if (!user) {
      console.warn("Invalid or missing reset token for:", email);
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Check if token expired
    const now = new Date();
    const expiry = user.getDataValue("resetPasswordExpires");
    if (!expiry || now > new Date(expiry)) {
      console.warn("Expired token for:", email);
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user record
    user.set({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
    await user.save();

    console.log(`Password reset successful for: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
