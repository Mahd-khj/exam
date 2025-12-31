"use client";

import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/api";
import type { Exam, TimetableEntry } from "@/lib/types";
import CustomTimetableBuilder from "@/components/student/CustomTimetableBuilder";
import TimetableGrid from "@/components/student/TimetableGrid";
import DownloadSchedule from "@/components/student/DownloadSchedule";
import {
  detectStudentTimetableClashes,
  getClashMessage,
  type ClashInfo,
} from "@/lib/utils/clashDetection";

export default function StudentDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<number[]>([]);
  const [selectedExams, setSelectedExams] = useState<Exam[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);

  // Load user, all exams, and user's saved classes (from DB only)
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userRes = await apiClient.request("/auth/me");
        if (!userRes?.success || !userRes?.user?.id) {
          console.error("User not authenticated");
          return;
        }

        const uid = userRes.user.id.toString();
        setUserId(uid);

        const examsRes = await apiClient.getAllExamsForStudent();
        const allExamsData = examsRes?.exams || [];
        setAllExams(allExamsData);

        // Load from database
        const dbRes = await apiClient.getUserClasses();
        if (dbRes?.success && Array.isArray(dbRes.classes)) {
          const savedExamIds = dbRes.classes.map((uc: any) => uc.examId);
          setSelectedExamIds(savedExamIds);

          const userExams = allExamsData.filter((exam) =>
            savedExamIds.includes(exam.id)
          );
          setSelectedExams(userExams);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Add a class (DB only)
  const handleAddClass = async (exam: Exam) => {
    if (selectedExamIds.includes(exam.id)) return;

    const newIds = [...selectedExamIds, exam.id];
    setSelectedExamIds(newIds);
    setSelectedExams([...selectedExams, exam]);

    try {
      await apiClient.addUserClass(exam.id);
    } catch (err) {
      console.error("Error adding user class:", err);
    }
  };

  // Remove a class (DB only)
  const handleRemoveClass = async (examId: number) => {
    const updatedIds = selectedExamIds.filter((id) => id !== examId);
    setSelectedExamIds(updatedIds);
    setSelectedExams(selectedExams.filter((e) => e.id !== examId));

    try {
      await apiClient.removeUserClass(examId);
    } catch (err) {
      console.error("Error removing user class:", err);
    }
  };

  // Reorder classes
  const handleExamsReorder = (exams: Exam[] | TimetableEntry[]) => {
    const newIds = exams.map((exam) => exam.id);
    setSelectedExamIds(newIds);
    setSelectedExams(exams as Exam[]);
  };

  // Detect clashes between selected exams
  const clashes = useMemo(() => {
    if (selectedExams.length < 2) return [];

    const allClashes: ClashInfo[] = [];
    const timetableEntries = selectedExams.map(
      (exam) =>
        ({
          ...exam,
          courseCode: exam.ClassCode?.code,
        } as TimetableEntry)
    );

    for (let i = 0; i < timetableEntries.length; i++) {
      const currentExam = timetableEntries[i];
      const otherExams = timetableEntries.filter((_, j) => j !== i);
      const examClashes = detectStudentTimetableClashes(currentExam, otherExams);
      allClashes.push(...examClashes);
    }

    return allClashes.filter(
      (clash, i, arr) =>
        i ===
        arr.findIndex(
          (c) =>
            (c.newClass.id === clash.newClass.id &&
              c.conflictingClass.id === clash.conflictingClass.id) ||
            (c.newClass.id === clash.conflictingClass.id &&
              c.conflictingClass.id === clash.newClass.id)
        )
    );
  }, [selectedExams]);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Loading your dashboard...
      </div>
    );

  // Same design, DB-only behavior
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Student Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select exams and arrange them in your preferred order
          </p>
        </div>
        <div>
          <DownloadSchedule allExams={allExams} studentExams={selectedExams} />
        </div>
      </div>

      {/* Clash Warning */}
      {clashes.length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Schedule Conflict Detected ({clashes.length})
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {clashes.map((clash, index) => (
                    <li key={index}>{getClashMessage(clash)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.64fr_1.36fr]">
        {/* Left Column */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Selected Classes ({selectedExams.length})
            </h2>
            <CustomTimetableBuilder
              exams={selectedExams.map(
                (exam) =>
                  ({
                    ...exam,
                    courseCode: exam.ClassCode?.code,
                  } as TimetableEntry)
              )}
              onExamsChange={handleExamsReorder}
              onRemoveClass={handleRemoveClass}
              allAvailableExams={allExams}
              onAddClass={handleAddClass}
              clashes={clashes}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Your Custom Timetable ({selectedExams.length})
          </h2>
          {loadingExams || loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Loading timetable...
            </div>
          ) : (
            <TimetableGrid
              allExams={allExams}
              studentEntries={selectedExams.map(
                (exam) =>
                  ({
                    ...exam,
                    courseCode: exam.ClassCode?.code,
                  } as TimetableEntry)
              )}
              clashes={clashes}
              onRemoveClass={handleRemoveClass}
            />
          )}
        </div>
      </div>
    </div>
  );
}
