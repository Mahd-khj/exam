import type { TimetableEntry, Exam } from '@/lib/types';

export interface ClashInfo {
  newClass: TimetableEntry | Exam;
  conflictingClass: TimetableEntry | Exam;
  date: string;
  timeOverlap: {
    newStart: string;
    newEnd: string;
    conflictingStart: string;
    conflictingEnd: string;
  };
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Check if two time ranges overlap (excluding exact end-to-start times)
 * 
 * Two time ranges overlap if:
 * - start1 < end2 AND start2 < end1
 * 
 * Edge case: Exact end-to-start times (e.g., 10:00-11:00 and 11:00-12:00) are NOT clashes
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // Check for overlap: start1 < end2 AND start2 < end1
  // This excludes exact end-to-start times (e.g., 10:00-11:00 and 11:00-12:00)
  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Detect clashes when adding a new class to the student's timetable
 * 
 * A clash occurs when:
 * - The day/date is the same AND
 * - The time ranges overlap (including partial overlaps)
 * 
 * @param newClass - The class being added
 * @param existingClasses - All classes already in the student's timetable
 * @returns Array of clash information, empty if no clashes
 */
export function detectStudentTimetableClashes(
  newClass: TimetableEntry | Exam,
  existingClasses: (TimetableEntry | Exam)[]
): ClashInfo[] {
  const clashes: ClashInfo[] = [];

  // Normalize the new class date
  const newClassDate = newClass.date;
  if (!newClassDate) {
    return clashes; // No date means no clash possible
  }

  if (!newClass.startTime || !newClass.endTime) {
    return clashes; // No time means no clash possible
  }

  // Check against all existing classes
  for (const existingClass of existingClasses) {
    // Skip if no date or time
    if (!existingClass.date || !existingClass.startTime || !existingClass.endTime) {
      continue;
    }

    // Check if same day/date
    if (existingClass.date === newClassDate) {
      // Check if time ranges overlap
      const overlaps = timeRangesOverlap(
        newClass.startTime,
        newClass.endTime,
        existingClass.startTime,
        existingClass.endTime
      );
      
      if (overlaps) {
        clashes.push({
          newClass,
          conflictingClass: existingClass,
          date: newClassDate,
          timeOverlap: {
            newStart: newClass.startTime,
            newEnd: newClass.endTime,
            conflictingStart: existingClass.startTime,
            conflictingEnd: existingClass.endTime,
          },
        });
      }
    }
  }

  return clashes;
}

/**
 * Check if adding a course would create clashes in the timetable
 * 
 * This function fetches all exams for the new course and checks them
 * against the existing timetable entries.
 * 
 * @param courseCode - The course code being added
 * @param existingTimetable - Current timetable entries
 * @param allExams - All available exams (to find exams for the new course)
 * @returns Array of clash information, empty if no clashes
 */
export function detectCourseClashes(
  courseCode: string,
  existingTimetable: TimetableEntry[],
  allExams: Exam[]
): ClashInfo[] {
  // Find all exams for the new course
  const newCourseExams = allExams.filter(
    (exam) => exam.ClassCode?.code === courseCode || exam.courseCode === courseCode
  );

  console.log('detectCourseClashes:', {
    courseCode,
    newCourseExamsCount: newCourseExams.length,
    existingTimetableCount: existingTimetable.length,
    newCourseExams: newCourseExams.map(e => ({
      id: e.id,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      code: e.ClassCode?.code || e.courseCode
    }))
  });

  // Check each exam from the new course against existing timetable
  const allClashes: ClashInfo[] = [];
  for (const newExam of newCourseExams) {
    const clashes = detectStudentTimetableClashes(newExam, existingTimetable);
    if (clashes.length > 0) {
      console.log('Found clashes for exam:', {
        examId: newExam.id,
        examDate: newExam.date,
        examTime: `${newExam.startTime}-${newExam.endTime}`,
        clashesCount: clashes.length
      });
    }
    allClashes.push(...clashes);
  }

  return allClashes;
}

/**
 * Get a user-friendly clash message
 */
export function getClashMessage(clash: ClashInfo): string {
  const newCourseCode = 
    clash.newClass.courseCode || 
    clash.newClass.ClassCode?.code || 
    'Unknown Course';
  const conflictingCourseCode = 
    clash.conflictingClass.courseCode || 
    clash.conflictingClass.ClassCode?.code || 
    'Unknown Course';

  return `The class "${newCourseCode}" (${clash.timeOverlap.newStart} - ${clash.timeOverlap.newEnd}) overlaps with "${conflictingCourseCode}" (${clash.timeOverlap.conflictingStart} - ${clash.timeOverlap.conflictingEnd}) on ${clash.date}.`;
}

