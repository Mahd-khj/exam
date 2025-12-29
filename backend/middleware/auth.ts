import { NextRequest } from "next/server";
import SessionToken from "../models/SessionToken";
import User from "../models/User";
import { initializeDatabase } from "../db-init";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: any; error?: string }> {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return { user: null, error: "No token provided" };
    }

    // Find session token - get userId directly from sessionToken (more reliable)
    const sessionToken = await SessionToken.findOne({
      where: { token },
      raw: true, // Get plain object to access userId directly
    });

    if (!sessionToken) {
      return { user: null, error: "Invalid token" };
    }

    // Check if token is expired
    if (new Date() > new Date(sessionToken.expiresAt)) {
      return { user: null, error: "Token expired" };
    }

    // Get userId directly from sessionToken
    const userId = (sessionToken as any).userId;
    if (!userId) {
      console.error("Authentication error: SessionToken has no userId", sessionToken);
      return { user: null, error: "User not found" };
    }

    // IMPORTANT: Re-fetch user from database to get the latest role (in case it was updated)
    // This ensures we always get the current role from the database, not cached data
    const freshUser = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role'],
      raw: true // Use raw to get plain object
    });

    if (!freshUser) {
      console.error(`Authentication error: User with ID ${userId} not found in database`);
      return { user: null, error: "User not found" };
    }

    return {
      user: {
        id: freshUser.id,
        email: freshUser.email,
        name: freshUser.name,
        role: freshUser.role, // Always use fresh role from database
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { user: null, error: "Authentication failed" };
  }
}
