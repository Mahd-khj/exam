import type { Exam } from '@/lib/types';

export const ROW_HEIGHT = 60;
export const PIXELS_PER_MINUTE = ROW_HEIGHT / 60;
export const COL_WIDTH = 210;
export const TIME_COL_WIDTH = 120;

export function timeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function generateTimeSlots(earliestTime: string, latestTime: string): string[] {
  const startMinutes = timeToMinutes(earliestTime);
  const endMinutes = timeToMinutes(latestTime);
  const roundedStart = Math.floor(startMinutes / 60) * 60;
  const roundedEnd = Math.ceil(endMinutes / 60) * 60;
  const slots: string[] = [];
  for (let minutes = roundedStart; minutes <= roundedEnd; minutes += 60) {
    slots.push(minutesToTime(minutes));
  }
  return slots;
}

export function calculateGridStructure(selectedExams: Exam[], allExams: Exam[]): {
  gridStartMinutes: number;
  gridEndMinutes: number;
  gridHeight: number;
  sortedDates: string[];
} {
  if (allExams.length === 0 || selectedExams.length === 0) {
    throw new Error('No exams to display');
  }
  const allTimesMinutes = allExams.flatMap(exam => [
    timeToMinutes(exam.startTime),
    timeToMinutes(exam.endTime)
  ]);
  const earliestMinutes = Math.min(...allTimesMinutes);
  const latestMinutes = Math.max(...allTimesMinutes);
  const gridStartMinutes = Math.floor(earliestMinutes / 60) * 60;
  const gridEndMinutes = Math.ceil(latestMinutes / 60) * 60;
  const datesWithExams = new Set<string>();
  allExams.forEach(exam => {
    if (exam.date) {
      datesWithExams.add(exam.date);
    }
  });
  const sortedDates = Array.from(datesWithExams).sort();
  const gridHeight = (gridEndMinutes - gridStartMinutes) * PIXELS_PER_MINUTE;
  return {
    gridStartMinutes,
    gridEndMinutes,
    gridHeight,
    sortedDates,
  };
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}



