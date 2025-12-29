// @ts-nocheck
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./db";

// Import models (ensure they are registered)
import "./models/User";
import "./models/Room";
import "./models/ClassCode";
import "./models/ExamTable";
import "./models/SessionToken";

// Import routes
import userRoutes from "./routes/userRoutes";
import roomRoutes from "./routes/roomRoutes";
import classCodeRoutes from "./routes/classCodeRoutes";
import examTableRoutes from "./routes/examTableRoutes";
import sessionTokenRoutes from "./routes/sessionTokenRoutes";



const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (req: any, res: any) => {
  res.json({ message: "Exam Schedule API is running!" });
});

// API routes
app.use("/users", userRoutes);
app.use("/rooms", roomRoutes);
app.use("/classcodes", classCodeRoutes);
app.use("/exam-table", examTableRoutes);
app.use("/auth", sessionTokenRoutes);
export default app;

// Start server if running directly
// Server start is handled in server.ts
