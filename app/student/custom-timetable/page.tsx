'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import CustomTimetableBuilder from '@/components/student/CustomTimetableBuilder';
import TimetableGrid from '@/components/student/TimetableGrid';

interface Exam {
  id: number;
  title: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: { name: string };
  classCode?: { code: string };
}

export default function CustomTimetablePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExams, setSelectedExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clashWarning, setClashWarning] = useState<string | null>(null);

  // ✅ Load all user data and exams
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1️⃣ Authenticate user
        const authRes = await apiClient.request('/auth/me');
        if (!authRes?.success || !authRes?.user?.id) {
          console.error('User not authenticated');
          return;
        }
        const userId = authRes.user.id.toString();
        setUserId(userId);

        // 2️⃣ Fetch all exams
        const examsRes = await apiClient.getAllExamsForStudent();
        if (examsRes.success && Array.isArray(examsRes.exams)) {
          setExams(examsRes.exams);
        }

        // 3️⃣ Load student's saved classes from DB
        const userClassesRes = await apiClient.getUserClasses();
        if (userClassesRes.success && Array.isArray(userClassesRes.classes)) {
          const userExamIds = userClassesRes.classes
            .filter((cls: any) => cls.examId)
            .map((cls: any) => cls.examId);
          const saved = examsRes.exams.filter((exam: Exam) =>
            userExamIds.includes(exam.id)
          );
          setSelectedExams(saved);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ Check for clashes before adding
  const hasClash = (newExam: Exam, existing: Exam[]) => {
    return existing.some((exam) => {
      if (exam.date !== newExam.date) return false;
      const newStart = new Date(`${newExam.date}T${newExam.startTime}`);
      const newEnd = new Date(`${newExam.date}T${newExam.endTime}`);
      const oldStart = new Date(`${exam.date}T${exam.startTime}`);
      const oldEnd = new Date(`${exam.date}T${exam.endTime}`);
      return (
        (newStart >= oldStart && newStart < oldEnd) ||
        (newEnd > oldStart && newEnd <= oldEnd)
      );
    });
  };

  // ✅ Add or remove exam (sync with backend)
  const toggleExam = async (exam: Exam) => {
    if (!userId) return;
    setSaving(true);

    try {
      const isSelected = selectedExams.some((e) => e.id === exam.id);

      if (isSelected) {
        // ❌ Remove exam from DB
        const res = await apiClient.removeUserClass(exam.id);
        if (res.success) {
          setSelectedExams(selectedExams.filter((e) => e.id !== exam.id));
        }
      } else {
        // ⚠️ Check for time clash
        if (hasClash(exam, selectedExams)) {
          setClashWarning(
            `⚠️ ${exam.title} overlaps with another scheduled exam.`
          );
          setTimeout(() => setClashWarning(null), 4000);
          return;
        }

        // ✅ Add exam to DB
        const res = await apiClient.addUserClass(exam.id, exam.classCode?.id);
        if (res.success) {
          setSelectedExams([...selectedExams, exam]);
        }
      }
    } catch (err) {
      console.error('Error toggling exam:', err);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Download timetable as text
  const downloadTimetable = () => {
    const text = selectedExams
      .map(
        (exam) =>
          `${exam.title} (${exam.date}) - ${exam.startTime} to ${exam.endTime}`
      )
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'timetable.txt';
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500">
        Loading your timetable...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">📚 Custom Timetable Builder</h1>

      {clashWarning && (
        <div className="bg-yellow-200 text-yellow-800 p-3 rounded mb-4">
          {clashWarning}
        </div>
      )}

      {/* Selected exams summary */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Selected Exams</h2>
        {selectedExams.length > 0 ? (
          <ul className="list-disc ml-6 text-gray-700">
            {selectedExams.map((exam) => (
              <li key={exam.id}>
                {exam.title} ({exam.date} - {exam.startTime})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No exams selected yet.</p>
        )}
      </div>

      {/* Builder for adding/removing */}
      <CustomTimetableBuilder
        exams={exams}
        selectedExams={selectedExams}
        onSelectExam={toggleExam}
        saving={saving}
      />

      {/* Visual timetable */}
      <div className="mt-10">
        <TimetableGrid exams={selectedExams} />
      </div>

      {/* Download button */}
      {selectedExams.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={downloadTimetable}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ⬇️ Download Timetable
          </button>
        </div>
      )}
    </div>
  );
}
