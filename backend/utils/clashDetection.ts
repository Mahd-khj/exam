import { Op } from "sequelize";
import ExamTable from "../models/ExamTable";
import ClassCode from "../models/ClassCode";
import User from "../models/User";

export interface ClashResult {
  hasClash: boolean;
  clashes: Array<{
    type: "room" | "student" | "teacher";
    message: string;
    conflictingExam: any;
  }>;
}

interface ExamData {
  date: string;
  startTime: string;
  endTime: string;
  roomId: number;
  classCodeId: number;
  excludeExamId?: number;
}

// Check if two time ranges overlap

function timeOverlaps(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(":").map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  };

  const start1Minutes = parseTime(start1);
  const end1Minutes = parseTime(end1);
  const start2Minutes = parseTime(start2);
  const end2Minutes = parseTime(end2);

  // Two time ranges overlap if: start1 < end2 AND start2 < end1
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

// Detect clashes for a given exam entry

export async function detectClashes(examData: ExamData): Promise<ClashResult> {
  const clashes: ClashResult["clashes"] = [];

  // Build where clause
  const whereClause: any = {
    date: examData.date,
  };

  if (examData.excludeExamId) {
    whereClause.id = { [Op.ne]: examData.excludeExamId };
  }

  // Find all exams on the same date
  const existingExams = await ExamTable.findAll({
    where: whereClause,
    include: [
      {
        model: ClassCode,
        include: [
          { model: User, as: "teacher", attributes: ["id", "name"] },
          { model: User, as: "students", attributes: ["id", "name"] },
        ],
      },
    ],
  });

  // Get the class code for the new/updated exam
  const newExamClassCode = await ClassCode.findByPk(examData.classCodeId, {
    include: [
      { model: User, as: "teacher", attributes: ["id", "name"] },
      { model: User, as: "students", attributes: ["id", "name"] },
    ],
  });

  if (!newExamClassCode) {
    return { hasClash: false, clashes: [] };
  }

  // Check each existing exam for clashes
  for (const existingExam of existingExams) {
    const existingClassCode = (existingExam as any).ClassCode;

    // Check if times overlap
    if (
      !timeOverlaps(
        examData.startTime,
        examData.endTime,
        existingExam.startTime,
        existingExam.endTime
      )
    ) {
      continue; // No time overlap, skip
    }

    // 1. ROOM CLASH: Same room + overlapping time + same date
    if (existingExam.roomId === examData.roomId) {
      clashes.push({
        type: "room",
        message: `Room is already booked for another exam during this time`,
        conflictingExam: {
          id: existingExam.id,
          title: existingExam.title,
          date: existingExam.date,
          startTime: existingExam.startTime,
          endTime: existingExam.endTime,
          classCode: existingClassCode?.code,
        },
      });
    }

    // 2. TEACHER CLASH: Same teacher + overlapping time + same date
    const newTeacherId = (newExamClassCode as any).teacher_id;
    const existingTeacherId = existingClassCode?.teacher_id;

    if (newTeacherId && existingTeacherId && newTeacherId === existingTeacherId) {
      const teacherName = (newExamClassCode as any).teacher?.name;
      clashes.push({
        type: "teacher",
        message: `Teacher "${teacherName}" is already assigned to another exam during this time`,
        conflictingExam: {
          id: existingExam.id,
          title: existingExam.title,
          date: existingExam.date,
          startTime: existingExam.startTime,
          endTime: existingExam.endTime,
          classCode: existingClassCode?.code,
        },
      });
    }

    // 3. STUDENT CLASH: Same student enrolled in both courses
    const newExamStudents = (newExamClassCode as any).students || [];
    const existingExamStudents = existingClassCode?.students || [];

    const newStudentIds = newExamStudents.map((s: any) => s.id);
    const existingStudentIds = existingExamStudents.map((s: any) => s.id);
    const commonStudentIds = newStudentIds.filter((id: number) =>
      existingStudentIds.includes(id)
    );

    if (commonStudentIds.length > 0) {
      const commonStudents = newExamStudents.filter((s: any) =>
        commonStudentIds.includes(s.id)
      );
      const studentNames = commonStudents.map((s: any) => s.name).join(", ");

      clashes.push({
        type: "student",
        message: `Student(s) "${studentNames}" are enrolled in both courses and have overlapping exam times`,
        conflictingExam: {
          id: existingExam.id,
          title: existingExam.title,
          date: existingExam.date,
          startTime: existingExam.startTime,
          endTime: existingExam.endTime,
          classCode: existingClassCode?.code,
        },
      });
    }
  }

  return {
    hasClash: clashes.length > 0,
    clashes,
  };
}
