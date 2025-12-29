'use client';

import type { Clash } from '@/lib/types';

interface ClashAlertProps {
  clashes: Clash[];
  onClose?: () => void;
}

export default function ClashAlert({ clashes, onClose }: ClashAlertProps) {
  if (!clashes || clashes.length === 0) return null;

  const getClashColor = (type: string) => {
    switch (type) {
      case 'room':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'teacher':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200';
      case 'student':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="mb-4 space-y-2">
      {clashes.map((clash, index) => (
        <div
          key={index}
          className={`rounded-md border p-4 ${getClashColor(clash.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold capitalize">{clash.type} Conflict</h4>
              <p className="mt-1 text-sm">{clash.message}</p>
              {clash.conflictingExam && (
                <div className="mt-2 rounded bg-white/50 dark:bg-gray-800/50 p-2 text-xs">
                  <p>
                    <strong>Conflicting Exam:</strong> {clash.conflictingExam.classCode || 'N/A'}
                  </p>
                  <p>
                    <strong>Date:</strong> {clash.conflictingExam.date} |{' '}
                    <strong>Time:</strong> {clash.conflictingExam.startTime} - {clash.conflictingExam.endTime}
                  </p>
                </div>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
