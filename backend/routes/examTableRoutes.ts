import express from "express";
import { createExamEntry, getAllExamTables } from "../controllers/examTableController";

const router = express.Router();

router.post("/", createExamEntry);
router.get("/", getAllExamTables);

export default router;
