'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import ExamForm from '@/components/admin/ExamForm';
import type { Exam } from '@/lib/types';

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const examId = params?.id;
    if (examId) {
      loadExam(Number(examId));
    }
  }, [params]);

  const loadExam = async (id: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getExam(id);

      if (response.success && response.exam) {
        setExam(response.exam);
      } else {
        setError(response.error || 'Failed to load exam');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    const examId = params?.id;
    if (!examId) {
      return { success: false };
    }

    const response = await apiClient.updateExam(Number(examId), data);

    if (response.success) {
      router.push('/admin/exams');
      return { success: true };
    }

    return {
      success: false,
      clashes: response.clashes,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Exam</h1>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Exam</h1>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Exam</h1>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400">Exam not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Exam</h1>
      </div>
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
        <ExamForm exam={exam} onSubmit={handleSubmit} onCancel={() => router.back()} />
      </div>
    </div>
  );
}
