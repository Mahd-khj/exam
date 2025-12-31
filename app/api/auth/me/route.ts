import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/backend/db-init";
import { authenticateRequest } from "@/backend/middleware/auth";

// GET /api/auth/me
//Returns the currently authenticated user based on the session token.
export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await initializeDatabase();

    // Validate the Authorization header
    const { user, error } = await authenticateRequest(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Success — return the user's info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/auth/me:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
