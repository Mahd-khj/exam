'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import ExamList from '@/components/admin/ExamList';
import type { Exam } from '@/lib/types';

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await apiClient.getExams();
      if (response.success && response.exams) {
        setExams(response.exams);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await apiClient.deleteExam(id);
      if (response.success) {
        setExams(exams.filter((exam) => exam.id !== id));
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await apiClient.deleteAllExams();
      if (response.success) {
        setExams([]);
      } else {
        throw new Error(response.error || 'Delete all failed');
      }
    } catch (error: any) {
      throw error;
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return <ExamList exams={exams} onDelete={handleDelete} onDeleteAll={handleDeleteAll} onRefresh={loadExams} />;
}
