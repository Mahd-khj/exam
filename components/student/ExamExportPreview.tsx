'use client';

import { useEffect, useState } from 'react';
import { generateExamPDFBlob, generateExamImageBlob, downloadBlob, type ExportFormat } from '@/lib/utils/examExport';
import type { Exam } from '@/lib/types';

interface ExamExportPreviewProps {
  exams: Exam[];
  allExams: Exam[];
  format: ExportFormat;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
  filename?: string;
}

export default function ExamExportPreview({
  exams,
  allExams,
  format,
  isOpen,
  onClose,
  onConfirm,
  filename,
}: ExamExportPreviewProps) {
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate export blob when modal opens or format changes
  useEffect(() => {
    if (isOpen && exams.length > 0) {
      setIsGenerating(true);
      setError(null);
      
      const generateExport = async () => {
        try {
          let blob: Blob;
          
          if (format === 'pdf') {
            blob = generateExamPDFBlob(exams, allExams);
          } else {
            blob = await generateExamImageBlob(exams, allExams, format);
          }
          
          setExportBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setIsGenerating(false);
        } catch (err) {
          console.error('Failed to generate export preview:', err);
          setError(err instanceof Error ? err.message : 'Failed to generate preview');
          setIsGenerating(false);
        }
      };

      generateExport();
    } else {
      // Cleanup when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setExportBlob(null);
    }

    // Cleanup function
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, exams, allExams, format]);

  const handleConfirm = () => {
    if (exportBlob) {
      const defaultFilename = filename || `exam-timetable.${format === 'jpg' ? 'jpg' : format}`;
      downloadBlob(exportBlob, defaultFilename);
      onConfirm(exportBlob);
      onClose();
    }
  };

  if (!isOpen) return null;

  const getFormatLabel = () => {
    switch (format) {
      case 'pdf':
        return 'PDF';
      case 'png':
        return 'PNG Image';
      case 'jpg':
        return 'JPG Image';
      default:
        return 'Export';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Export Preview - {getFormatLabel()}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review your timetable before downloading ({exams.length} {exams.length === 1 ? 'exam' : 'exams'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close preview"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden p-6">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Generating preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 font-semibold">Error generating preview</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900">
              {format === 'pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                  style={{ minHeight: '600px' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewUrl}
                    alt="Timetable preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No preview available</p>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!exportBlob || isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download {getFormatLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}

