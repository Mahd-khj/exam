import User from "../../models/User";
import SessionToken from "../../models/SessionToken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { initializeDatabase } from "../../db-init";
import { sendVerificationEmail } from "../../utils/email"; // added import

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  password: string;
  role?: "admin" | "student";
}

export interface LoginResult {
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

export interface SignupResult {
  success: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}

// Signup new user (with email verification)

export async function signup(credentials: SignupCredentials): Promise<SignupResult> {
  try {
    await initializeDatabase();

    const { email, username, password, role = "student" } = credentials;

    if (!email || !username || !password) {
      return { success: false, error: "Email, username, and password are required" };
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name: username,
      email,
      password: hashedPassword,
      role,
      verified: false,
      verificationToken,
      verificationExpires,
    });

    console.log(`Verification link: http://localhost:3000/api/auth/verify?token=${verificationToken}`);

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Signup error:", error);
    return { success: false, error: error.message || "Signup failed" };
  }
}

// Login user (only if verified)

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    await initializeDatabase();
    const { email, password } = credentials;

    const user = await User.findOne({ where: { email }, raw: true });
    if (!user) return { success: false, error: "Invalid credentials" };

    if (!user.verified) {
      return { success: false, error: "Please verify your email before logging in." };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return { success: false, error: "Invalid credentials" };

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await SessionToken.create({ userId: user.id, token, expiresAt });

    return {
      success: true,
      token,
      expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Login failed" };
  }
}

// Logout (invalidate token)

export async function logout(token: string): Promise<{ success: boolean }> {
  try {
    await initializeDatabase();
    await SessionToken.destroy({ where: { token } });
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}
