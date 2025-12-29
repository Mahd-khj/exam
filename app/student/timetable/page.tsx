'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import CourseSelector from '@/components/student/CourseSelector';
import TimetableGrid from '@/components/student/TimetableGrid';
import type { TimetableEntry, Exam } from '@/lib/types';
import { detectCourseClashes, getClashMessage, type ClashInfo } from '@/lib/utils/clashDetection';

export default function TimetablePage() {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [clashes, setClashes] = useState<ClashInfo[]>([]);
  const [clashMessage, setClashMessage] = useState<string>('');

  // Load all exams on mount to determine grid structure
  useEffect(() => {
    loadAllExams();
  }, []);

  // Load selected courses from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedCourses');
    if (saved) {
      try {
        const courses = JSON.parse(saved);
        setSelectedCourses(courses);
        if (courses.length > 0) {
          loadTimetable(courses);
        }
      } catch (error) {
        console.error('Failed to load saved courses:', error);
      }
    }
  }, []);

  const loadAllExams = async () => {
    setLoadingExams(true);
    try {
      const response = await apiClient.getAllExamsForStudent();
      if (response.success && response.exams) {
        setAllExams(response.exams);
      }
    } catch (error) {
      console.error('Failed to load all exams:', error);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleCourseChange = async (courses: string[]) => {
    // Determine which course is being added (if any)
    const isAdding = courses.length > selectedCourses.length;
    const courseBeingAdded = isAdding 
      ? courses.find(c => !selectedCourses.includes(c))
      : null;

    // If adding a course, check for clashes before updating
    if (isAdding && courseBeingAdded) {
      // Wait for exams to load if they haven't loaded yet
      if (allExams.length === 0) {
        console.log('Waiting for exams to load before clash check...');
        // If exams aren't loaded, proceed without clash check for now
        // We'll check again after exams load
        setClashes([]);
        setClashMessage('');
        setSelectedCourses(courses);
        localStorage.setItem('selectedCourses', JSON.stringify(courses));
        if (courses.length > 0) {
          await loadTimetable(courses);
        }
        return;
      }

      // Get current timetable entries (before adding the new course)
      const currentTimetable = timetable.length > 0 
        ? timetable 
        : await loadTimetableForClashCheck(selectedCourses);

      // Check for clashes with the new course
      const detectedClashes = detectCourseClashes(
        courseBeingAdded,
        currentTimetable,
        allExams
      );

      console.log('Clash check:', {
        courseBeingAdded,
        currentTimetableCount: currentTimetable.length,
        allExamsCount: allExams.length,
        detectedClashesCount: detectedClashes.length,
        detectedClashes
      });

      if (detectedClashes.length > 0) {
        // Clash detected - prevent adding the course
        console.log('Clash detected! Preventing course addition.');
        setClashes(detectedClashes);
        const messages = detectedClashes.map(getClashMessage);
        setClashMessage(messages.join('\n\n'));
        // Don't update selectedCourses or timetable - this keeps the checkbox unchecked
        return;
      }
    }

    // No clash or removing a course - proceed normally
    console.log('No clash detected, proceeding with course change');
    setClashes([]);
    setClashMessage('');
    setSelectedCourses(courses);
    localStorage.setItem('selectedCourses', JSON.stringify(courses));

    if (courses.length > 0) {
      await loadTimetable(courses);
    } else {
      setTimetable([]);
    }
  };

  // Helper function to load timetable for clash checking (without setting state)
  const loadTimetableForClashCheck = async (courses: string[]): Promise<TimetableEntry[]> => {
    try {
      const response = await apiClient.getTimetable(courses);
      if (response.success && response.timetable) {
        return response.timetable;
      }
      return [];
    } catch (error) {
      console.error('Failed to load timetable for clash check:', error);
      return [];
    }
  };

  const loadTimetable = async (courses: string[]) => {
    setLoading(true);
    try {
      const response = await apiClient.getTimetable(courses);
      if (response.success && response.timetable) {
        setTimetable(response.timetable);
      }
    } catch (error) {
      console.error('Failed to load timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Exam Timetable</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select your courses to view your personalized exam schedule
        </p>
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
        <CourseSelector
          selectedCourses={selectedCourses}
          onChange={handleCourseChange}
        />
      </div>

      {/* Clash Alert - Show when clashes are detected */}
      {clashes.length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 p-4 shadow-lg dark:shadow-gray-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                  Schedule Conflict Detected
                </h3>
              </div>
              {clashMessage && (
                <div className="text-sm text-red-800 dark:text-red-300 whitespace-pre-line mb-2">
                  {clashMessage}
                </div>
              )}
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                The course has not been added to your timetable. Please resolve the conflict or choose a different course.
              </p>
            </div>
            <button
              onClick={() => {
                setClashes([]);
                setClashMessage('');
              }}
              className="ml-4 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200 text-xl font-bold leading-none w-6 h-6 flex items-center justify-center"
              aria-label="Close clash alert"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Always show grid, even when no courses selected - grid will show empty structure */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
        {loadingExams || loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Loading timetable...</div>
        ) : (
          <TimetableGrid 
            allExams={allExams} 
            studentEntries={timetable}
            clashes={clashes}
          />
        )}
      </div>
    </div>
  );
}
