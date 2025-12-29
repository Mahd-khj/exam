'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Exam, TimetableEntry } from '@/lib/types';
import { getCourseColor } from '@/lib/utils/colors';

interface CustomTimetableBuilderProps {
  exams: Exam[] | TimetableEntry[];
  onExamsChange: (exams: Exam[] | TimetableEntry[]) => void;
  onRemoveClass?: (examId: number) => void;
  allAvailableExams?: Exam[]; // All available exams for searching
  onAddClass?: (exam: Exam) => void; // Function to add a class
  clashes?: Array<{ newClass: Exam | TimetableEntry; conflictingClass: Exam | TimetableEntry }>; // Clash information
}

interface SortableExamCardProps {
  exam: Exam | TimetableEntry;
  onRemove?: (examId: number) => void;
  hasConflict?: boolean; // Whether this exam is in a conflict
}

function SortableExamCard({ exam, onRemove, hasConflict = false }: SortableExamCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exam.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const courseCode = (exam as TimetableEntry).courseCode || exam.ClassCode?.code || 'N/A';
  const backgroundColor = getCourseColor(exam.classCodeId || courseCode);
  const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  const bgOpacity = hslMatch ? `hsla(${hslMatch[1]}, ${hslMatch[2]}%, ${hslMatch[3]}%, 0.2)` : 'rgba(100, 150, 200, 0.2)';

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`mb-3 cursor-grab active:cursor-grabbing rounded-lg border-2 p-4 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'z-50' : ''
      } ${hasConflict ? 'ring-2 ring-red-500 dark:ring-red-400 ring-offset-2 border-red-500 dark:border-red-400' : ''}`}
      style={{
        ...style,
        backgroundColor: bgOpacity,
        borderColor: hasConflict ? '#ef4444' : backgroundColor,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {courseCode}
            </h3>
            {exam.title && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                - {exam.title}
              </span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                {exam.day}, {exam.date}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Time:</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                {exam.startTime} - {exam.endTime}
              </span>
            </div>
            {exam.Room && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Room:</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{exam.Room.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(exam.id);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors relative z-20"
              title="Remove class"
              type="button"
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
          )}
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function CustomTimetableBuilder({
  exams,
  onExamsChange,
  onRemoveClass,
  allAvailableExams = [],
  onAddClass,
  clashes = [],
}: CustomTimetableBuilderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create a set of exam IDs that are in conflicts
  const conflictingExamIds = new Set<number>();
  clashes.forEach(clash => {
    conflictingExamIds.add(clash.newClass.id);
    conflictingExamIds.add(clash.conflictingClass.id);
  });

  // Helper to check if an exam is in conflict
  const isExamInConflict = (examId: number): boolean => {
    return conflictingExamIds.has(examId);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter ALL available exams based on search term (for searching available classes)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || !allAvailableExams.length) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return allAvailableExams.filter((exam) => {
      const courseCode = (exam.ClassCode?.code || '').toLowerCase();
      const title = (exam.title || '').toLowerCase();
      const roomName = (exam.Room?.name || '').toLowerCase();
      const date = (exam.date || '').toLowerCase();
      const day = (exam.day || '').toLowerCase();
      const startTime = (exam.startTime || '').toLowerCase();
      const endTime = (exam.endTime || '').toLowerCase();

      return (
        courseCode.includes(searchLower) ||
        title.includes(searchLower) ||
        roomName.includes(searchLower) ||
        date.includes(searchLower) ||
        day.includes(searchLower) ||
        startTime.includes(searchLower) ||
        endTime.includes(searchLower)
      );
    });
  }, [allAvailableExams, searchTerm]);

  // Filter selected exams based on search term (for filtering selected classes list)
  const filteredExams = useMemo(() => {
    if (!searchTerm.trim()) {
      return exams;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return exams.filter((exam) => {
      const courseCode = ((exam as TimetableEntry).courseCode || exam.ClassCode?.code || '').toLowerCase();
      const title = (exam.title || '').toLowerCase();
      const roomName = (exam.Room?.name || '').toLowerCase();
      const date = (exam.date || '').toLowerCase();
      const day = (exam.day || '').toLowerCase();
      const startTime = (exam.startTime || '').toLowerCase();
      const endTime = (exam.endTime || '').toLowerCase();

      return (
        courseCode.includes(searchLower) ||
        title.includes(searchLower) ||
        roomName.includes(searchLower) ||
        date.includes(searchLower) ||
        day.includes(searchLower) ||
        startTime.includes(searchLower) ||
        endTime.includes(searchLower)
      );
    });
  }, [exams, searchTerm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Use original exams array for index calculation to maintain correct order
      const oldIndex = exams.findIndex((exam) => exam.id === active.id);
      const newIndex = exams.findIndex((exam) => exam.id === over.id);

      const newExams = arrayMove(exams, oldIndex, newIndex);
      onExamsChange(newExams);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar - Always Visible */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
          <svg
            className="h-5 w-5 text-gray-400"
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
        </div>
        <input
          type="text"
          placeholder="Search classes by course code, title, room, date, or time..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {searchTerm && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSearchTerm('');
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
            title="Clear search"
            type="button"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results - Show available classes when searching */}
      {searchTerm && searchResults.length > 0 && (
        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Available Classes ({searchResults.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((exam) => {
              const isAlreadySelected = exams.some((e) => e.id === exam.id);
              const courseCode = exam.ClassCode?.code || 'N/A';
              
              return (
                <div
                  key={exam.id}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    isAlreadySelected
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {courseCode}
                      {exam.title && (
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          - {exam.title}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {exam.date} {exam.startTime} - {exam.endTime}
                      {exam.Room && ` • Room: ${exam.Room.name}`}
                    </div>
                  </div>
                  {onAddClass && (
                    <button
                      onClick={() => {
                        if (!isAlreadySelected) {
                          onAddClass(exam);
                          setSearchTerm(''); // Clear search bar after adding
                        }
                      }}
                      disabled={isAlreadySelected}
                      className={`ml-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        isAlreadySelected
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                      }`}
                    >
                      {isAlreadySelected ? 'Added' : 'Add'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Search Results Message */}
      {searchTerm && searchResults.length === 0 && allAvailableExams.length > 0 && (
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
          No available classes found matching "{searchTerm}"
        </div>
      )}

      {/* Empty State - No Exams Selected */}
      {exams.length === 0 && !searchTerm && (
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
          No exams selected. Search for classes above to add them to your timetable.
        </div>
      )}

      {/* No Results Message for Selected Classes */}
      {exams.length > 0 && searchTerm && filteredExams.length === 0 && searchResults.length === 0 && (
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
          No selected classes found matching "{searchTerm}"
        </div>
      )}

      {/* Selected Classes List - Show when not searching OR when searching and there are filtered results */}
      {filteredExams.length > 0 && (
        <div>
          {searchTerm && (
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Your Selected Classes ({filteredExams.length})
            </h3>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filteredExams.map((exam) => exam.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {filteredExams.map((exam) => (
                  <SortableExamCard 
                    key={exam.id} 
                    exam={exam} 
                    onRemove={onRemoveClass}
                    hasConflict={isExamInConflict(exam.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}


