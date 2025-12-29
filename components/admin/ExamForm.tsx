'use client';

import { useState, useEffect } from 'react';
import type { Exam, Clash } from '@/lib/types';
import { apiClient } from '@/lib/api';
import ClashAlert from './ClashAlert';
import DatePicker from './DatePicker';
import AutocompleteInput from './AutocompleteInput';

interface ExamFormProps {
  exam?: Exam;
  onSubmit: (data: any) => Promise<{ success: boolean; clashes?: Clash[] }>;
  onCancel?: () => void;
}

interface ClassCode {
  id: number;
  code: string;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
}

// Helper function to get day name from date
// Expects date in YYYY-MM-DD format
function getDayFromDate(dateStr: string): string {
  if (!dateStr) return '';
  // Ensure we're working with YYYY-MM-DD format for reliable parsing
  const normalizedDate = dateStr.includes('/') ? formatDateToYYYYMMDD(dateStr) : dateStr;
  const date = new Date(normalizedDate);
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateStr);
    return '';
  }
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

// Helper function to convert YYYY-MM-DD to DD/MM/YYYY
function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  // Convert from YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = dateStr.split('-');
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD
function formatDateToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Convert from DD/MM/YYYY to YYYY-MM-DD
  const [day, month, year] = dateStr.split('/');
  if (day && month && year) {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Validate the date components
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      return dateStr; // Return original if parsing fails
    }
    
    // Validate day and month ranges
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return dateStr; // Return original if invalid
    }
    
    return `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  }
  return dateStr;
}

export default function ExamForm({ exam, onSubmit, onCancel }: ExamFormProps) {
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    date: exam?.date ? formatDateToDDMMYYYY(exam.date) : '',
    startTime: exam?.startTime || '',
    endTime: exam?.endTime || '',
    classCode: exam?.ClassCode?.code || '',
    roomName: exam?.Room?.name || '',
  });

  const [clashes, setClashes] = useState<Clash[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classCodes, setClassCodes] = useState<ClassCode[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || '',
        date: exam.date ? formatDateToDDMMYYYY(exam.date) : '',
        startTime: exam.startTime || '',
        endTime: exam.endTime || '',
        classCode: exam.ClassCode?.code || '',
        roomName: exam.Room?.name || '',
      });
    }
  }, [exam]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [classCodesResponse, roomsResponse] = await Promise.all([
        apiClient.getClassCodes(),
        apiClient.getRooms(),
      ]);

      if (classCodesResponse.success && classCodesResponse.classCodes) {
        setClassCodes(classCodesResponse.classCodes);
      }

      if (roomsResponse.success && roomsResponse.rooms) {
        setRooms(roomsResponse.rooms);
      }
    } catch (error: any) {
      console.error('Failed to load options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setClashes([]);
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.classCode.trim()) {
        setError('Class code is required.');
        setLoading(false);
        return;
      }

      if (!formData.roomName.trim()) {
        setError('Room name is required.');
        setLoading(false);
        return;
      }

      // Convert date from DD/MM/YYYY to YYYY-MM-DD for backend
      const dateInYYYYMMDD = formatDateToYYYYMMDD(formData.date);
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInYYYYMMDD)) {
        setError('Invalid date format. Please use DD/MM/YYYY format.');
        setLoading(false);
        return;
      }

      // Calculate day from date automatically (using YYYY-MM-DD format)
      const day = getDayFromDate(dateInYYYYMMDD);
      
      // Backend will find or create room and class code automatically
      const result = await onSubmit({
        ...formData,
        date: dateInYYYYMMDD, // Send in YYYY-MM-DD format
        day, // Add calculated day
        classCode: formData.classCode.trim(), // Send class code string
        roomName: formData.roomName.trim(), // Send room name string
      });

      if (!result.success && result.clashes) {
        setClashes(result.clashes);
        setError('Clash detected. Please review the conflicts below.');
      } else if (!result.success) {
        setError('Failed to save exam');
      }
      // Success is handled by parent component
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && !clashes.length && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <ClashAlert clashes={clashes} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Class Code <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <AutocompleteInput
            value={formData.classCode}
            onChange={(value) => setFormData({ ...formData, classCode: value })}
            options={classCodes
              .filter((cc) => cc && cc.code)
              .map((cc) => ({
                id: cc.id,
                label: cc.code || '',
              }))}
            placeholder="Enter or select class code"
            required
            isLoading={loadingOptions}
            onSelect={(option) => {
              // Optionally auto-populate title if needed
              // For now, just set the class code
              setFormData({ ...formData, classCode: option.label });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title (Optional)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-black dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <DatePicker
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
            placeholder="DD/MM/YYYY"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Room <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <AutocompleteInput
            value={formData.roomName}
            onChange={(value) => setFormData({ ...formData, roomName: value })}
            options={rooms
              .filter((room) => room && room.name)
              .map((room) => ({
                id: room.id,
                label: room.name || '',
                subtitle: room.capacity ? `Capacity: ${room.capacity}` : undefined,
              }))}
            placeholder="Enter or select room name"
            required
            isLoading={loadingOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Time <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="time"
            required
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-black dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Time <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="time"
            required
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-black dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : exam ? 'Update Exam' : 'Create Exam'}
        </button>
      </div>
    </form>
  );
}
