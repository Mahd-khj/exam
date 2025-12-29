'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import ExamForm from '@/components/admin/ExamForm';

export default function NewExamPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await apiClient.createExam(data);

    if (response.success) {
      router.push('/admin/exams');
      return { success: true };
    }

    return {
      success: false,
      clashes: response.clashes,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Exam</h1>
      </div>
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
        <ExamForm onSubmit={handleSubmit} onCancel={() => router.back()} />
      </div>
    </div>
  );
}
