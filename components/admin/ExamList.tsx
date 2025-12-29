'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Exam } from '@/lib/types';

interface ExamListProps {
  exams: Exam[];
  onDelete: (id: number) => Promise<void>;
  onDeleteAll?: () => Promise<void>;
  onRefresh?: () => void;
}

export default function ExamList({ exams, onDelete, onDeleteAll, onRefresh }: ExamListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.ClassCode?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || exam.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    setDeletingId(id);
    try {
      await onDelete(id);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert('Failed to delete exam');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAll) return;
    
    if (!confirm('Are you sure you want to delete ALL exams? This action cannot be undone.')) return;

    setDeletingAll(true);
    try {
      await onDeleteAll();
      if (onRefresh) onRefresh();
    } catch (error) {
      alert('Failed to delete all exams');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Exams</h2>
        <div className="flex gap-2">
          {exams.length > 0 && onDeleteAll && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="inline-flex items-center rounded-md bg-red-600 dark:bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingAll ? 'Deleting All...' : 'Delete All'}
            </button>
          )}
          <Link
            href="/admin/exams/new"
            className="inline-flex items-center rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            + Create Exam
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Search by title or course code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:w-auto sm:flex-1"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:w-auto"
        />
        {(searchTerm || filterDate) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterDate('');
            }}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {filteredExams.length === 0 ? (
        <div className="rounded-md bg-gray-50 dark:bg-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No exams found
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Room
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredExams.map((exam) => (
                <tr key={exam.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {exam.title || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {exam.ClassCode?.code || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {exam.date} ({exam.day})
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {exam.startTime} - {exam.endTime}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {exam.Room?.name || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/admin/exams/${exam.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      disabled={deletingId === exam.id}
                      className="ml-4 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      {deletingId === exam.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
