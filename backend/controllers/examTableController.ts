import type { Request, Response } from "express";
import ExamTable from "../models/ExamTable";
import Room from "../models/Room";
import ClassCode from "../models/ClassCode";

// Create new exam table entry
export const createExamEntry = async (req: Request, res: Response) => {
  try {
    const { title, day, date, startTime, endTime, classCodeId, roomId } = req.body;

    // Check if all required fields are provided
    if (!day || !date || !startTime || !endTime || !classCodeId || !roomId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const newExam = await ExamTable.create({
      title,
      day,
      date,
      startTime,
      endTime,
      classCodeId,
      roomId,
    });

    res.status(201).json({ message: "Exam entry created successfully.", exam: newExam });
  } catch (error) {
    console.error("Error creating exam entry:", error);
    res.status(500).json({ message: "Internal server error.", error });
  }
};

// Get all exam tables
export const getAllExamTables = async (req: Request, res: Response) => {
  try {
    const exams = await ExamTable.findAll({
      include: [
        { model: Room, attributes: ["id", "roomNumber", "building"] },
        { model: ClassCode, attributes: ["id", "code", "subjectName"] },
      ],
    });

    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching exam tables:", error);
    res.status(500).json({ message: "Internal server error.", error });
  }
};
