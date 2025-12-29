// backend/modules/student/userClassService.ts
import UserClass from "../../models/UserClass";
import ExamTable from "../../models/ExamTable";
import ClassCode from "../../models/ClassCode";

/**
 * Fetch all classes/exams linked to a specific student.
 */
export async function getUserClasses(userId: number) {
  try {
    const records = await UserClass.findAll({
      where: { userId },
      include: [
        { model: ExamTable, as: "ExamTable" },
        { model: ClassCode, as: "ClassCode" },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log("✅ [getUserClasses] Found", records.length, "records for user", userId);
    return records;
  } catch (err: any) {
    console.error("❌ [getUserClasses] Error:", err);
    throw new Error("Failed to fetch user classes");
  }
}

/**
 * Add a class/exam record for a student.
 */
export async function addUserClass(
  userId: number,
  examId?: number,
  classCodeId?: number
) {
  try {
    console.log("🧩 [addUserClass] Called with:", { userId, examId, classCodeId });

    // Sanitize undefined values to null
    const validExamId = examId ?? null;
    const validClassCodeId = classCodeId ?? null;

    if (!validExamId && !validClassCodeId) {
      throw new Error("Either examId or classCodeId is required.");
    }

    // Prevent duplicates
    const existing = await UserClass.findOne({
      where: { userId, examId: validExamId, classCodeId: validClassCodeId },
    });

    if (existing) {
      console.warn("⚠️ [addUserClass] Duplicate record for user:", userId);
      throw new Error("Class already added for this user.");
    }

    const newRecord = await UserClass.create({
      userId,
      examId: validExamId,
      classCodeId: validClassCodeId,
    });

    console.log("✅ [addUserClass] Created record:", newRecord.toJSON());
    return { success: true, record: newRecord };
  } catch (err: any) {
    console.error("❌ [addUserClass] Error:", err);
    throw new Error(err.message || "Failed to add user class");
  }
}

/**
 * Remove a class/exam record for a student.
 */
export async function removeUserClass(
  userId: number,
  examId?: number,
  classCodeId?: number
) {
  try {
    console.log("🗑️ [removeUserClass] Removing:", { userId, examId, classCodeId });

    const deleted = await UserClass.destroy({
      where: {
        userId,
        examId: examId ?? null,
        classCodeId: classCodeId ?? null,
      },
    });

    if (!deleted) {
      throw new Error("No matching record found to delete.");
    }

    console.log("✅ [removeUserClass] Record deleted for user", userId);
    return { success: true };
  } catch (err: any) {
    console.error("❌ [removeUserClass] Error:", err);
    throw new Error(err.message || "Failed to remove user class");
  }
}
