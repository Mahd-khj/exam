import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/backend/db-init";
import User from "@/backend/models/User";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing verification token" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (user.verificationExpires && now > user.verificationExpires) {
      return NextResponse.json(
        { success: false, error: "Verification token has expired" },
        { status: 400 }
      );
    }

    const [updatedCount] = await User.update(
      {
        verified: true,
        verificationToken: null,
        verificationExpires: null,
      },
      { where: { verificationToken: token } }
    );

    if (updatedCount === 0) {
      console.error("Verification update failed — no rows affected");
      return NextResponse.json(
        { success: false, error: "Verification failed to update user" },
        { status: 500 }
      );
    }

    console.log(`User verified successfully with token: ${token}`);

    // ✅ Redirect instead of sending JSON
    return NextResponse.redirect(
      new URL("/login?verified=true", req.url),
      { status: 302 }
    );
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
