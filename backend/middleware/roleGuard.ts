import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "./auth";

/**
 * Middleware to ensure user is authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: any; error?: NextResponse }> {
  const authResult = await authenticateRequest(request);

  if (!authResult.user) {
    return {
      user: null,
      error: NextResponse.json(
        { message: "Unauthorized", error: authResult.error },
        { status: 401 }
      ),
    };
  }

  return { user: authResult.user };
}

/**
 * Middleware to ensure user is admin
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: any; error?: NextResponse }> {
  const authResult = await requireAuth(request);

  if (!authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { user: authResult.user };
}

/**
 * Middleware to ensure user is student
 */
export async function requireStudent(
  request: NextRequest
): Promise<{ user: any; error?: NextResponse }> {
  const authResult = await requireAuth(request);

  if (!authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== "student") {
    return {
      user: null,
      error: NextResponse.json(
        { message: "Forbidden: Student access required" },
        { status: 403 }
      ),
    };
  }

  return { user: authResult.user };
}
