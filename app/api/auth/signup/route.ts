import { NextRequest, NextResponse } from "next/server";
import { signup } from "@/backend/modules/shared/authService";
import { initializeDatabase } from "@/backend/db-init";

interface SignupRequest {
  email: string;
  username: string;
  password: string;
  role?: 'admin' | 'student';
}

interface SignupResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse>> {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    const body = await request.json() as SignupRequest;
    const { email, username, password, role } = body;

    // Validate all fields
    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate username (at least 3 characters)
    if (username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters long" },
        { status: 400 }
      );
    }

    // Validate password (at least 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const result = await signup({ email, username, password, role });

    if (result.success && result.user) {
      return NextResponse.json(
        {
          success: true,
          message: "Account created successfully",
          user: result.user,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Signup failed" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
