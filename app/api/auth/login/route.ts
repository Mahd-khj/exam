import { NextRequest, NextResponse } from "next/server";
import { login } from "@/backend/modules/shared/authService";
import { initializeDatabase } from "@/backend/db-init";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    // Validate both fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
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

    const result = await login({ email, password });

    if (result.success && result.token && result.user) {
      return NextResponse.json({
        success: true,
        token: result.token,
        expiresAt: result.expiresAt,
        user: result.user,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Login failed" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
