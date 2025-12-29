import express from "express";
import * as sessionTokenController from "../controllers/sessionTokenController";

const router = express.Router();

// Authentication routes
router.post("/login", sessionTokenController.login);
router.get("/validate/:token", sessionTokenController.validateToken);
router.delete("/logout/:token", sessionTokenController.logout);

// Session management routes
router.get("/user/:userId", sessionTokenController.getUserSessions);
router.delete("/:id", sessionTokenController.deleteSession);

export default router;