import ExamTable from "../../models/ExamTable";
import Room from "../../models/Room";
import ClassCode from "../../models/ClassCode";
import User from "../../models/User";
import { detectClashes } from "../../utils/clashDetection";
import { initializeDatabase } from "../../db-init";

// Get day name from date string

function getDayFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

export interface CreateExamData {
  title?: string;
  day?: string;
  date: string;
  startTime: string;
  endTime: string;
  classCodeId?: number;
  classCode?: string;
  roomId?: number;
  roomName?: string;
  userId?: number;
}

export interface UpdateExamData extends Partial<CreateExamData> {}

// Find or create a room by name

async function findOrCreateRoom(roomName: string, capacity?: number): Promise<number> {
  await initializeDatabase();
  
  if (!roomName || !roomName.trim()) {
    throw new Error("Room name is required");
  }

  const trimmedName = roomName.trim();
  
  // Try to find existing room
  let room = await Room.findOne({ where: { name: trimmedName } });
  
  if (!room) {
    // Create new room with provided capacity or default
    room = await Room.create({
      name: trimmedName,
      capacity: capacity || 50, // Default capacity if not provided
    });
  }
  
  return room.id;
}

// Find or create a class code by code

async function findOrCreateClassCode(classCode: string): Promise<number> {
  await initializeDatabase();
  
  if (!classCode || !classCode.trim()) {
    throw new Error("Class code is required");
  }

  const trimmedCode = classCode.trim();
  
  // Try to find existing class code
  let classCodeRecord = await ClassCode.findOne({ where: { code: trimmedCode } });
  
  if (!classCodeRecord) {
    // Create new class code
    classCodeRecord = await ClassCode.create({
      code: trimmedCode,
    });
  }
  
  return classCodeRecord.id;
}

// Create a new exam entry with clash detection

export async function createExam(data: CreateExamData) {
  // Ensure database is initialized
  await initializeDatabase();
  
  // Validate required fields (day is optional, will be calculated from date)
  if (!data.date || !data.startTime || !data.endTime) {
    throw new Error("Missing required fields: date, startTime, and endTime are required");
  }

  // Resolve room ID (from roomId or roomName)
let roomId: number;

if (typeof data.roomId === "number") {
  roomId = data.roomId;
} else if (typeof data.roomName === "string" && data.roomName.trim().length > 0) {
  roomId = await findOrCreateRoom(data.roomName.trim());
} else {
  throw new Error("Room name is required");
}


  // Resolve class code ID (from classCodeId or classCode)
let classCodeId: number;

if (typeof data.classCodeId === "number") {
  classCodeId = data.classCodeId;
} else if (typeof data.classCode === "string" && data.classCode.trim().length > 0) {
  classCodeId = await findOrCreateClassCode(data.classCode.trim());
} else {
  throw new Error("Class code is required");
}


  // Calculate day from date if not provided
  const day = data.day || getDayFromDate(data.date);

  // Check for clashes
  const clashResult = await detectClashes({
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    roomId: roomId,
    classCodeId: classCodeId,
  });

  if (clashResult.hasClash) {
    // Build a descriptive message for each clash
    const details = clashResult.clashes.map((c: any) => {
      const roomName = c.Room?.name || "Unknown Room";
      const classCode = c.ClassCode?.code || "Unknown Class";
      const start = c.startTime || "??:??";
      const end = c.endTime || "??:??";
      const date = c.date || "Unknown Date";

      // Determine what kind of conflict
      if (c.roomId === roomId && c.classCodeId === classCodeId) {
        return `Room "${roomName}" and class "${classCode}" already have an exam on ${date} from ${start} to ${end}`;
      } else if (c.roomId === roomId) {
        return `Room "${roomName}" is already booked on ${date} from ${start} to ${end}`;
      } else if (c.classCodeId === classCodeId) {
        return `Class "${classCode}" already has another exam on ${date} from ${start} to ${end}`;
      } else {
        return `Exam conflict on ${date} from ${start} to ${end}`;
      }
    });

    const combinedMessage =
      "Exam scheduling conflict detected: " + details.join("; ");

    return {
      success: false,
      message: combinedMessage,
      clashes: clashResult.clashes,
      exam: null,
    };
  }


    if (!roomId || !classCodeId) {
    throw new Error(
      `Resolved IDs invalid: roomId=${roomId}, classCodeId=${classCodeId}`
    );
  }

  // Create exam
  const exam = await ExamTable.create({
    title: data.title,
    day: day,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    classCodeId: classCodeId,
    roomId: roomId,
    userId: data.userId || null,
  });

  // Fetch with relations
  const examWithRelations = await ExamTable.findByPk(exam.id, {
    include: [
      { model: Room, attributes: ["id", "name", "capacity"] },
      {
        model: ClassCode,
        attributes: ["id", "code"],
        include: [
          { model: User, as: "teacher", attributes: ["id", "name"] },
        ],
      },
      { model: User, attributes: ["id", "name"] },
    ],
  });

  return {
    success: true,
    clashes: [],
    exam: examWithRelations,
  };
}

// Get all exam
export async function getAllExams(filters?: {
  search?: string;
  date?: string;
  roomId?: number;
}) {
  // Ensure database is initialized
  await initializeDatabase();
  const whereClause: any = {};

  if (filters?.date) {
    whereClause.date = filters.date;
  }

  if (filters?.roomId) {
    whereClause.roomId = filters.roomId;
  }

  const exams = await ExamTable.findAll({
    where: whereClause,
    include: [
      { model: Room, attributes: ["id", "name", "capacity"] },
      {
        model: ClassCode,
        attributes: ["id", "code"],
        include: [
          { model: User, as: "teacher", attributes: ["id", "name"] },
        ],
      },
      { model: User, attributes: ["id", "name"] },
    ],
    order: [["date", "ASC"], ["startTime", "ASC"]],
  });

  // Apply search filter if provided
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return exams.filter((exam: any) => {
      const classCode = exam.ClassCode?.code?.toLowerCase() || "";
      const title = exam.title?.toLowerCase() || "";
      return classCode.includes(searchLower) || title.includes(searchLower);
    });
  }

  return exams;
}

// Get single exam by ID
export async function getExamById(id: number) {
  const exam = await ExamTable.findByPk(id, {
    include: [
      { model: Room, attributes: ["id", "name", "capacity"] },
      {
        model: ClassCode,
        attributes: ["id", "code"],
        include: [
          { model: User, as: "teacher", attributes: ["id", "name"] },
          { model: User, as: "students", attributes: ["id", "name"] },
        ],
      },
      { model: User, attributes: ["id", "name"] },
    ],
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  return exam;
}

// Update exam entry with clash detection
export async function updateExam(id: number, data: UpdateExamData) {
  const existingExam = await ExamTable.findByPk(id);
  if (!existingExam) {
    throw new Error("Exam not found");
  }

  // Resolve room ID if roomName is provided
  if (data.roomName !== undefined) {
    data.roomId = await findOrCreateRoom(data.roomName);
  }

  // Resolve class code ID if classCode is provided
  if (data.classCode !== undefined) {
    data.classCodeId = await findOrCreateClassCode(data.classCode);
  }

  // Prepare update data
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.date !== undefined) {
    updateData.date = data.date;
    // Calculate day from date if date is updated and day is not explicitly provided
    if (data.day === undefined) {
      updateData.day = getDayFromDate(data.date);
    }
  }
  if (data.day !== undefined) updateData.day = data.day;
  if (data.startTime !== undefined) updateData.startTime = data.startTime;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.classCodeId !== undefined) updateData.classCodeId = data.classCodeId;
  if (data.roomId !== undefined) updateData.roomId = data.roomId;
  if (data.userId !== undefined) updateData.userId = data.userId;

  // Check for clashes if relevant fields are being updated
  const shouldCheckClashes =
    data.date || data.startTime || data.endTime || data.roomId || data.classCodeId;

  if (shouldCheckClashes) {
    const clashResult = await detectClashes({
      date: data.date || existingExam.date,
      startTime: data.startTime || existingExam.startTime,
      endTime: data.endTime || existingExam.endTime,
      roomId: data.roomId || existingExam.roomId,
      classCodeId: data.classCodeId || existingExam.classCodeId,
      excludeExamId: id,
    });

    if (clashResult.hasClash) {
      const details = clashResult.clashes.map((c: any) => {
        const roomName = c.Room?.name || "Unknown Room";
        const classCode = c.ClassCode?.code || "Unknown Class";
        const start = c.startTime || "??:??";
        const end = c.endTime || "??:??";
        const date = c.date || "Unknown Date";

        if (c.roomId === (data.roomId || existingExam.roomId) && c.classCodeId === (data.classCodeId || existingExam.classCodeId)) {
          return `Room "${roomName}" and class "${classCode}" already have an exam on ${date} from ${start} to ${end}`;
        } else if (c.roomId === (data.roomId || existingExam.roomId)) {
          return `Room "${roomName}" is already booked on ${date} from ${start} to ${end}`;
        } else if (c.classCodeId === (data.classCodeId || existingExam.classCodeId)) {
          return `Class "${classCode}" already has another exam on ${date} from ${start} to ${end}`;
        } else {
          return `Exam conflict on ${date} from ${start} to ${end}`;
        }
      });

      const combinedMessage =
        "Exam scheduling conflict detected: " + details.join("; ");

      return {
        success: false,
        message: combinedMessage,
        clashes: clashResult.clashes,
        exam: null,
      };
    }
  }

  // Update exam
  await ExamTable.update(updateData, { where: { id } });

  // Fetch updated exam
  const updatedExam = await ExamTable.findByPk(id, {
    include: [
      { model: Room, attributes: ["id", "name", "capacity"] },
      {
        model: ClassCode,
        attributes: ["id", "code"],
        include: [
          { model: User, as: "teacher", attributes: ["id", "name"] },
        ],
      },
      { model: User, attributes: ["id", "name"] },
    ],
  });

  return {
    success: true,
    clashes: [],
    exam: updatedExam,
  };
}

// Delete exam entry
export async function deleteExam(id: number) {
  const exam = await ExamTable.findByPk(id);
  if (!exam) {
    throw new Error("Exam not found");
  }

  await ExamTable.destroy({ where: { id } });
  return { success: true };
}

//  Delete all exam entries

export async function deleteAllExams() {
  await initializeDatabase();
  const deletedCount = await ExamTable.destroy({ where: {} });
  return { success: true, deletedCount };
}
