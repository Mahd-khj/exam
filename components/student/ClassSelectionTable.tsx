'use client';

/**
 * ClassSelectionTable Component
 * 
 * A clean implementation that:
 * - Starts completely empty (no data loaded)
 * - Fetches admin schedule data only on search
 * - Performs clash detection before adding classes
 * - Keeps admin data and student selection separate
 */

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Exam, TimetableEntry } from '@/lib/types';
import { detectStudentTimetableClashes, getClashMessage, type ClashInfo } from '@/lib/utils/clashDetection';
import { getCourseColor } from '@/lib/utils/colors';

interface ClassSelectionTableProps {
  selectedClasses: TimetableEntry[];
  onAddClass: (exam: Exam) => void;
  onRemoveClass?: (examId: number) => void;
}

export default function ClassSelectionTable({
  selectedClasses,
  onAddClass,
  onRemoveClass,
}: ClassSelectionTableProps) {
  // Component state - starts completely empty
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Exam[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [clashWarning, setClashWarning] = useState<ClashInfo[] | null>(null);
  const [highlightedExamId, setHighlightedExamId] = useState<number | null>(null);

  /**
   * Search for classes in admin schedule data
   * Only fetches when user explicitly searches
   */
  const handleSearch = async () => {
    const trimmed = searchTerm.trim();
    
    // Require at least 2 characters
    if (trimmed.length < 2) {
      setHasSearched(false);
      setSearchResults([]);
      setClashWarning(null);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setClashWarning(null);
    setHighlightedExamId(null);

    try {
      // Fetch from admin schedule data (read-only)
      const response = await apiClient.getAllExamsForStudent({ search: trimmed });
      
      if (response.success && response.exams) {
        setSearchResults(response.exams);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search admin schedule:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle Enter key in search input
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Validate and add a class to student timetable
   * Performs clash detection before adding
   */
  const handleAddClass = (exam: Exam) => {
    // Validate: Check for clashes against current student timetable
    const clashes = detectStudentTimetableClashes(exam, selectedClasses);

    if (clashes.length > 0) {
      // Clash detected - prevent addition and show warning
      setClashWarning(clashes);
      setHighlightedExamId(exam.id);
      
      // Auto-clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightedExamId(null);
      }, 5000);
      
      return; // Do not add the class
    }

    // No clash - add to student timetable
    setClashWarning(null);
    setHighlightedExamId(null);
    onAddClass(exam);
  };

  /**
   * Check if an exam is already in student timetable
   */
  const isAlreadyAdded = (examId: number): boolean => {
    return selectedClasses.some((entry) => entry.id === examId);
  };

  /**
   * Check if an exam would clash with current timetable
   */
  const wouldClash = (exam: Exam): boolean => {
    const clashes = detectStudentTimetableClashes(exam, selectedClasses);
    return clashes.length > 0;
  };

  /**
   * Clear search and reset state
   */
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
    setClashWarning(null);
    setHighlightedExamId(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by course code, title, or room (min 2 characters)..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            // Clear results if search is cleared
            if (!value.trim()) {
              handleClearSearch();
            }
          }}
          onKeyPress={handleKeyPress}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-black dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim() || searchTerm.trim().length < 2}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        {hasSearched && (
          <button
            onClick={handleClearSearch}
            className="rounded-md bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Clash Warning */}
      {clashWarning && clashWarning.length > 0 && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Schedule Conflict Detected
              </h4>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {clashWarning.map((clash, index) => (
                    <li key={index}>{getClashMessage(clash)}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => {
                setClashWarning(null);
                setHighlightedExamId(null);
              }}
              className="ml-4 flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Search Results Table */}
      {hasSearched && (
        <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isSearching ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Searching admin schedule...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No classes found matching "{searchTerm}"
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Course Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Day & Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Room
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((exam) => {
                    const courseCode = exam.ClassCode?.code || 'N/A';
                    const backgroundColor = getCourseColor(exam.classCodeId || courseCode);
                    const isAdded = isAlreadyAdded(exam.id);
                    const hasConflict = wouldClash(exam);
                    const isHighlighted = highlightedExamId === exam.id;

                    return (
                      <tr
                        key={exam.id}
                        className={`transition-colors ${
                          isHighlighted
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : hasConflict
                            ? 'bg-yellow-50 dark:bg-yellow-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="h-3 w-3 rounded-full mr-2"
                              style={{ backgroundColor }}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {courseCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {exam.title || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {exam.day}, {exam.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {exam.startTime} - {exam.endTime}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {exam.Room?.name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                          {isAdded ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              ✓ Added
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddClass(exam)}
                              disabled={hasConflict && !isHighlighted}
                              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                hasConflict && !isHighlighted
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                              }`}
                              title={
                                hasConflict && !isHighlighted
                                  ? 'This class conflicts with your current timetable'
                                  : 'Add to timetable'
                              }
                            >
                              {hasConflict && !isHighlighted ? '⚠ Conflict' : 'Add'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty State - Shown when no search has been performed */}
      {!hasSearched && (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Enter at least 2 characters and click "Search" to find classes from the admin schedule
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            No classes are displayed until you perform a search
          </p>
        </div>
      )}
    </div>
  );
}







