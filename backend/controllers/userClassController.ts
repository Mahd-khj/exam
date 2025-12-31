// backend/controllers/userClassController.ts
import { requireStudent } from "../middleware/roleGuard";
import { getUserClasses, addUserClass, removeUserClass } from "../modules/student/userClassService";

// Fetch all classes linked to the logged-in student

export async function getClasses(request: any) {
  const { user, error } = await requireStudent(request);
  if (error) return error;

  try {
    const classes = await getUserClasses(user.id);
    return { success: true, classes };
  } catch (err: any) {
    console.error("Error fetching user classes:", err);
    return { success: false, error: err.message };
  }
}

// Add a class for the logged-in student
export async function createClass(request: any) {
  const { user, error } = await requireStudent(request);
  if (error) return error;

  try {
    const { examId, classCodeId } = await request.json();
    const created = await addUserClass(user.id, examId, classCodeId);
    return { success: true, created };
  } catch (err: any) {
    console.error("Error adding user class:", err);
    return { success: false, error: err.message };
  }
}

// Delete a class for the logged-in student
export async function deleteClass(request: any) {
  const { user, error } = await requireStudent(request);
  if (error) return error;

  try {
    const { examId, classCodeId } = await request.json();
    const deleted = await removeUserClass(user.id, examId, classCodeId);
    return { success: true, deleted };
  } catch (err: any) {
    console.error("Error deleting user class:", err);
    return { success: false, error: err.message };
  }
}
