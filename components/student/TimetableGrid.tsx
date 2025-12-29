'use client';

import { useEffect, useRef, useState } from 'react';
import type { Exam, TimetableEntry } from '@/lib/types';
import { getCourseColor } from '@/lib/utils/colors';
import type { ClashInfo } from '@/lib/utils/clashDetection';

interface TimetableGridProps {
  allExams: Exam[]; // All available exams (to determine grid structure)
  studentEntries: TimetableEntry[]; // Student's selected classes (to fill grid cells)
  clashes?: ClashInfo[]; // Clash information for visual highlighting
  onRemoveClass?: (examId: number) => void; // Callback to remove a class
}

/**
 * Parse time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  // Ignore seconds if present (parts[2])
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generate time slots with 1-hour intervals
 */
function generateTimeSlots(earliestTime: string, latestTime: string): string[] {
  const startMinutes = timeToMinutes(earliestTime);
  const endMinutes = timeToMinutes(latestTime);
  
  // Round start down to nearest hour, end up to nearest hour
  const roundedStart = Math.floor(startMinutes / 60) * 60;
  const roundedEnd = Math.ceil(endMinutes / 60) * 60;
  
  const slots: string[] = [];
  for (let minutes = roundedStart; minutes <= roundedEnd; minutes += 60) {
    slots.push(minutesToTime(minutes));
  }
  
  return slots;
}

/**
 * Get day name from date string
 */
function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Check if two time ranges overlap (excluding exact end-to-start times)
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

  return start1Min < end2Min && start2Min < end1Min;
}

// Grid dimension constants - shared between grid and class cells
const ROW_HEIGHT = 60; // Intended visual height for 1 hour
const DEFAULT_PIXELS_PER_MINUTE = ROW_HEIGHT / 60; // Fallback scale before measurement
const COL_WIDTH = 210; // Wider day columns for a roomier timetable
const TIME_COL_WIDTH = 120; // Keep time column unchanged

/**
 * Individual Class Cell Component
 * Each class is an independent component that positions itself and detects conflicts
 * Positioned absolutely relative to the grid container based on exact time calculations
 */
interface ClassCellProps {
  entry: TimetableEntry;
  gridStartMinutes: number; // Shared rounded grid start (minutes)
  allEntries: TimetableEntry[];
  onRemove?: (examId: number) => void;
  dayWidth: number;
  pixelsPerMinute: number;
}

function ClassCell({ entry, gridStartMinutes, allEntries, onRemove, dayWidth, pixelsPerMinute }: ClassCellProps) {
  // Base vertical positioning: depends ONLY on time and shared gridStartMinutes
  const entryStartMinutes = timeToMinutes(entry.startTime);
  const entryEndMinutes = timeToMinutes(entry.endTime);
  const baseTopPixels = (entryStartMinutes - gridStartMinutes) * pixelsPerMinute;
  const heightPixels = (entryEndMinutes - entryStartMinutes) * pixelsPerMinute;
  
  // Debug: Log for classes that don't start on the hour to verify positioning
  if (process.env.NODE_ENV === 'development' && entryStartMinutes % 60 !== 0) {
    console.log('Class positioning debug:', {
      courseCode: entry.courseCode || entry.ClassCode?.code,
      entryTime: entry.startTime,
      gridStartMinutes,
      topPixels: baseTopPixels,
      heightPixels,
      entryStartMinutes,
      calculatedOffset: entryStartMinutes - gridStartMinutes,
      expectedOffset: `${Math.floor((entryStartMinutes - gridStartMinutes) / 60)}h ${(entryStartMinutes - gridStartMinutes) % 60}m`,
    });
  }
  
  // Calculate left position: dateIndex * column width
  // Detect conflicts with other classes - each cell checks independently
  const hasConflict = allEntries.some(otherEntry => {
    if (otherEntry.id === entry.id || !otherEntry.date || !otherEntry.startTime || !otherEntry.endTime) {
      return false;
    }
    
    // Same date and overlapping time = conflict
    if (otherEntry.date === entry.date) {
      return timeRangesOverlap(
        entry.startTime,
        entry.endTime,
        otherEntry.startTime,
        otherEntry.endTime
      );
    }
    
    return false;
  });

  // Simple z-index based on start time for visual stacking (later classes on top)
  const allSameDay = allEntries.filter(e => e.date === entry.date);
  const sortedByStartTime = [...allSameDay].sort((a, b) => 
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  const zIndex = sortedByStartTime.findIndex(e => e.id === entry.id) + 10;

  const courseCode = entry.courseCode || entry.ClassCode?.code || 'N/A';
  const backgroundColor = getCourseColor(entry.classCodeId || courseCode);

  return (
    <div
      className={`absolute rounded p-2 text-xs text-white shadow-lg flex flex-col justify-start group ${
        hasConflict ? 'ring-2 ring-red-500 dark:ring-red-400 border-2 border-red-500 dark:border-red-400' : ''
      } ${onRemove ? 'cursor-pointer hover:opacity-100 hover:z-50 transition-transform' : ''}`}
      style={{
        backgroundColor,
        top: `${baseTopPixels}px`,
        left: 0,
        width: `${dayWidth}px`,
        height: `${heightPixels}px`,
        zIndex: zIndex,
        boxSizing: 'border-box',
      }}
      title={`${courseCode}${entry.title ? ` - ${entry.title}` : ''}\n${entry.startTime} - ${entry.endTime}${entry.Room ? `\nRoom: ${entry.Room.name}` : ''}${hasConflict ? '\n⚠️ Schedule Conflict' : ''}${onRemove ? '\nClick to remove' : ''}`}
      onClick={() => {
        if (onRemove) {
          onRemove(entry.id);
        }
      }}
    >
      {onRemove && (
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded-full p-1 text-white z-10"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (onRemove) {
              onRemove(entry.id);
            }
          }}
          title="Remove class"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
      <div className="font-semibold truncate">{courseCode}</div>
      {entry.title && (
        <div className="text-xs opacity-90 truncate mt-1">{entry.title}</div>
      )}
      <div className="text-xs opacity-75 mt-1">
        {entry.startTime} - {entry.endTime}
      </div>
      {entry.Room && (
        <div className="text-xs opacity-75 mt-1">{entry.Room.name}</div>
      )}
      {hasConflict && (
        <div className="text-xs opacity-90 mt-1 font-bold">⚠️ Conflict</div>
      )}
    </div>
  );
}

export default function TimetableGrid({ allExams, studentEntries, clashes = [], onRemoveClass }: TimetableGridProps) {
  // Hooks must be declared before any early-return dependent calculations
  const dayColumnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dayColumnWidths, setDayColumnWidths] = useState<Record<string, number>>({});
  const firstBodyCellRef = useRef<HTMLTableCellElement | null>(null);
  const [pixelsPerMinute, setPixelsPerMinute] = useState(DEFAULT_PIXELS_PER_MINUTE);

  // If no exams exist, show empty grid structure
  if (allExams.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No classes available. The timetable grid will appear here once classes are created.</p>
      </div>
    );
  }

  // Calculate time range from all exams
  // Use numeric minutes to avoid lexicographic issues (e.g., "8:00" vs "08:00")
  const allTimes = allExams.flatMap(exam => [exam.startTime, exam.endTime]);
  const allTimesMinutes = allTimes.map(timeToMinutes);
  const earliestMinutes = Math.min(...allTimesMinutes);
  const latestMinutes = Math.max(...allTimesMinutes);
  const earliestTime = minutesToTime(earliestMinutes);
  const latestTime = minutesToTime(latestMinutes);

  // Calculate day/date range from all exams
  const datesWithExams = new Set<string>();
  allExams.forEach(exam => {
    if (exam.date) {
      datesWithExams.add(exam.date);
    }
  });
  
  // Sort dates chronologically
  const sortedDates = Array.from(datesWithExams).sort();
  
  // Helper to check if a date is in the past
  const isPastDate = (dateStr: string): boolean => {
    const examDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    return examDate < today;
  };

  // Generate time slots (rounds earliest down, latest up to nearest hour)
  const timeSlots = generateTimeSlots(earliestTime, latestTime);

  // Extract rounded start/end times directly from generated slots to ensure exact match
  // timeSlots[0] is the rounded start time (e.g., "08:00" from "08:30")
  // timeSlots[timeSlots.length - 1] is the rounded end time (e.g., "22:00" from "21:30")
  const roundedStartTime = timeSlots[0];
  const roundedEndTime = timeSlots[timeSlots.length - 1];
  const roundedStartMinutes = timeToMinutes(roundedStartTime);
  const roundedEndMinutes = timeToMinutes(roundedEndTime);

  // Verify rounded times match table rows (for debugging)
  if (process.env.NODE_ENV === 'development') {
    console.log('Timetable grid times:', {
      earliestTime,
      latestTime,
      roundedStartTime,
      roundedEndTime,
      firstSlot: timeSlots[0],
      lastSlot: timeSlots[timeSlots.length - 1],
    });
  }

  // Group time slots into pairs for display (each row represents 1 hour)
  const timeSlotPairs: Array<{ start: string; end: string }> = [];
  for (let i = 0; i < timeSlots.length - 1; i++) {
    timeSlotPairs.push({
      start: timeSlots[i],
      end: timeSlots[i + 1],
    });
  }

  // Calculate grid dimensions using the measured time scale
  const gridHeight = (roundedEndMinutes - roundedStartMinutes) * pixelsPerMinute;

  // Build a lookup of entries by date for per-day positioning
  const entriesByDate: Record<string, TimetableEntry[]> = {};
  studentEntries
    .filter(entry => entry.date && entry.startTime && entry.endTime)
    .forEach(entry => {
      const date = entry.date!;
      if (!entriesByDate[date]) {
        entriesByDate[date] = [];
      }
      entriesByDate[date].push(entry);
    });

  // Measure actual day column widths for precise horizontal layout
  useEffect(() => {
    const measure = () => {
      const next: Record<string, number> = {};
      // Measure first body time cell to sync pixelsPerMinute with real row height
      if (firstBodyCellRef.current) {
        const h = firstBodyCellRef.current.getBoundingClientRect().height;
        if (h > 0) {
          const derived = h / 60; // minutes per row are fixed (60)
          setPixelsPerMinute((prev) =>
            Math.abs(prev - derived) < 0.1 ? prev : derived
          );
        }
      }
      sortedDates.forEach((date) => {
        const el = dayColumnRefs.current[date];
        if (el) next[date] = el.getBoundingClientRect().width;
      });
      setDayColumnWidths((prev) => {
        const same =
          Object.keys(next).length === Object.keys(prev).length &&
          Object.keys(next).every((k) => Math.abs((next[k] ?? 0) - (prev[k] ?? 0)) < 0.5);
        return same ? prev : next;
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [sortedDates, studentEntries.length]);

  // Calculate grid width using measured day widths (fallback to COL_WIDTH)
  const gridWidth = sortedDates.reduce(
    (sum, date) => sum + (dayColumnWidths[date] ?? COL_WIDTH),
    0
  );

  return (
    <div className="overflow-x-auto">
      {/* Grid Container - position: relative for absolute positioning of class cells */}
      <div className="inline-block min-w-full align-middle relative">
        {/* Grid Table - Acts as positioning reference */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Time
              </th>
              {sortedDates.map((date) => {
                const isPast = isPastDate(date);
                return (
                  <th
                    key={date}
                    className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                      isPast 
                        ? 'text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-900' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    style={{ width: `${COL_WIDTH}px` }}
                  >
                    <div className="flex flex-col">
                      <span>{getDayName(date)}</span>
                      <span className="text-xs font-normal mt-1">{formatDate(date)}</span>
                      {isPast && (
                        <span className="text-xs font-normal mt-1 text-gray-400">(Past)</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {timeSlotPairs.map((slot, slotIndex) => (
              <tr key={`${slot.start}-${slot.end}`}>
                <td 
                  className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" 
                  style={{ height: `${ROW_HEIGHT}px`, width: `${TIME_COL_WIDTH}px` }}
                  ref={slotIndex === 0 ? (el) => { firstBodyCellRef.current = el; } : undefined}
                >
                  {slot.start}
                </td>
                {sortedDates.map((date, dateIndex) => {
                  const isFirstRow = slotIndex === 0;
                  const entries = entriesByDate[date] || [];
                  const dayWidth = dayColumnWidths[date] ?? COL_WIDTH;

                  return (
                    <td
                      key={`${date}-${slotIndex}`}
                      className="px-2 py-2 text-sm border-r border-gray-200 dark:border-gray-700 last:border-r-0 align-top"
                      style={{ height: `${ROW_HEIGHT}px`, width: `${COL_WIDTH}px`, position: 'relative' }}
                      ref={isFirstRow ? (el) => { dayColumnRefs.current[date] = el as HTMLDivElement | null; } : undefined}
                    >
                      {isFirstRow && (
                        <div
                          className="pointer-events-none"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${dayWidth}px`,
                            height: `${gridHeight}px`,
                          }}
                        >
                          <div className="relative w-full h-full pointer-events-auto">
                            {entries.map((entry) => (
                              <ClassCell
                                key={entry.id}
                                entry={entry}
                                gridStartMinutes={roundedStartMinutes}
                                allEntries={entries}
                                onRemove={onRemoveClass}
                                dayWidth={dayWidth}
                                pixelsPerMinute={pixelsPerMinute}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
