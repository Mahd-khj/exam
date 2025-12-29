export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
}

export interface ClassCode {
  id: number;
  code: string;
  exam_date?: string;
  start_time?: string;
  end_time?: string;
  teacher_id?: number;
  room_id?: number;
}

export interface Exam {
  id: number;
  title?: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  classCodeId: number;
  roomId: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  Room?: Room;
  ClassCode?: ClassCode & {
    teacher?: User;
    students?: User[];
  };
  User?: User;
}

export interface Clash {
  type: 'room' | 'student' | 'teacher';
  message: string;
  conflictingExam: {
    id: number;
    title?: string;
    date: string;
    startTime: string;
    endTime: string;
    classCode?: string;
  };
}

export interface Course {
  id: number;
  code: string;
}

export interface TimetableEntry extends Exam {
  courseCode?: string;
}
