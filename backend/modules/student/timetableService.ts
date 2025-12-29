import ExamTable from "../../models/ExamTable";
import ClassCode from "../../models/ClassCode";
import Room from "../../models/Room";
import User from "../../models/User";
import { initializeDatabase } from "../../db-init";

/**
 * Get personalized exam timetable for a student based on their course codes
 */
export async function getStudentTimetable(courseCodes: string[]) {
  // Ensure database is initialized
  await initializeDatabase();
  
  if (!courseCodes || courseCodes.length === 0) {
    return [];
  }

  // Find all class codes that match the student's courses
  const classCodes = await ClassCode.findAll({
    where: {
      code: courseCodes,
    },
    include: [
      {
        model: ExamTable,
        include: [
          { model: Room, attributes: ["id", "name", "capacity"] },
          {
            model: ClassCode,
            attributes: ["id", "code"],
            include: [
              { model: User, as: "teacher", attributes: ["id", "name"] },
            ],
          },
        ],
      },
    ],
  });

  // Extract all exams from the class codes
  const exams: any[] = [];
  classCodes.forEach((classCode: any) => {
    if (classCode.ExamTables && classCode.ExamTables.length > 0) {
      classCode.ExamTables.forEach((exam: any) => {
        exams.push({
          ...exam.toJSON(),
          courseCode: classCode.code,
        });
      });
    }
  });

  // Sort by date and time
  exams.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  return exams;
}

/**
 * Get all available course codes (for student course selection)
 */
export async function getAllCourseCodes() {
  // Ensure database is initialized
  await initializeDatabase();
  const classCodes = await ClassCode.findAll({
    attributes: ["id", "code"],
    order: [["code", "ASC"]],
  });

  return classCodes.map((cc) => ({
    id: cc.id,
    code: cc.code,
  }));
}
