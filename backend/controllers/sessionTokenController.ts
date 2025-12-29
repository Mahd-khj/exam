import express from "express";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import SessionToken from "../models/SessionToken";
import User from "../models/User";
import bcrypt from "bcrypt";

// Login and create a new session token
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = uuidv4();
    
    // Set expiration (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session token
    const sessionToken = await SessionToken.create({
      userId: user.id,
      token,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Return token and user info
    return res.status(200).json({
      token: sessionToken.token,
      expiresAt: sessionToken.expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Validate token
export const validateToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find token
    const sessionToken = await SessionToken.findOne({
      where: { token },
      include: [User],
    });

    // Check if token exists and is not expired
    if (!sessionToken || new Date() > new Date(sessionToken.expiresAt)) {
      return res.status(401).json({ valid: false });
    }

    // Return user info
    return res.status(200).json({
      valid: true,
      user: {
        id: sessionToken.userId,
        name: (sessionToken as any).User.name,
        email: (sessionToken as any).User.email,
        role: (sessionToken as any).User.role,
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Logout (invalidate token)
export const logout = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Delete the token
    await SessionToken.destroy({ where: { token } });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all active sessions for a user
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const sessions = await SessionToken.findAll({
      where: { 
        userId,
        expiresAt: { [Op.gt]: new Date() }
      },
      attributes: ['id', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt']
    });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error("Get user sessions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a specific session
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await SessionToken.destroy({ where: { id } });

    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Delete session error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};