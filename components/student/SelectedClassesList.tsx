'use client';

/**
 * SelectedClassesList Component
 * 
 * Displays only the selected classes with delete buttons.
 * No checkboxes - just a clean list of selected classes.
 */

import type { TimetableEntry } from '@/lib/types';
import { getCourseColor } from '@/lib/utils/colors';

interface SelectedClassesListProps {
  selectedClasses: TimetableEntry[];
  onRemoveClass: (examId: number) => void;
}

export default function SelectedClassesList({
  selectedClasses,
  onRemoveClass,
}: SelectedClassesListProps) {
  // TEMPORARY DEBUG MARKER - Remove after diagnosis
  const renderId = Math.random().toString(36).substring(7);
  console.log('[SelectedClassesList] Rendered with ID:', renderId, 'at', new Date().toISOString());
  
  if (selectedClasses.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          No classes selected yet
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          Search and add classes to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* TEMPORARY DEBUG MARKER - Remove after diagnosis */}
      <div className="bg-yellow-200 dark:bg-yellow-900 p-2 text-xs font-bold text-yellow-900 dark:text-yellow-100 border-2 border-yellow-500">
        🔍 DEBUG: SelectedClassesList Render ID: {renderId} | Route: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}
      </div>
      <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {selectedClasses.map((entry) => {
            const courseCode = entry.courseCode || entry.ClassCode?.code || 'N/A';
            const backgroundColor = getCourseColor(entry.classCodeId || courseCode);

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div
                    className="h-4 w-4 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {courseCode}
                      </span>
                      {entry.title && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          - {entry.title}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {entry.day}, {entry.date}
                      </span>
                      <span>
                        {entry.startTime} - {entry.endTime}
                      </span>
                      {entry.Room && (
                        <span>
                          Room: {entry.Room.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${courseCode} from your timetable?`)) {
                      onRemoveClass(entry.id);
                    }
                  }}
                  className="ml-4 flex-shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors"
                  title="Remove class"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

