import express from "express";
import { createExamEntry, getAllExamTables } from "../controllers/examTableController";

const router = express.Router();

router.post("/", createExamEntry);       // Add exam entry
router.get("/", getAllExamTables);       // Get all exam tables

export default router;
