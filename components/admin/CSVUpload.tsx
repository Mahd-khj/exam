'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function CSVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.uploadCSV(file);

      if (response.success) {
        setResult(response.result);
      } else {
        setError(response.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Exam Data</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload exam data from a CSV, XLSX, or XLS file. The file should include columns:
          courseCode, date, startTime, endTime, room (required)
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            File (CSV, XLSX, or XLS)
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">{error}</div>
        )}

        {result && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-200">Upload Complete!</h3>
            <p className="mt-1 text-sm text-green-800 dark:text-green-200">
              Success: {result.success} | Failed: {result.failed}
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <h4 className="font-medium text-green-900 dark:text-green-200">Errors:</h4>
                <ul className="mt-1 list-inside list-disc text-sm text-green-800 dark:text-green-200">
                  {result.errors.slice(0, 10).map((err: any, idx: number) => (
                    <li key={idx}>
                      Row {err.row}: {err.error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>... and {result.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
}
