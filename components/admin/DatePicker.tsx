'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string; // DD/MM/YYYY format
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  required = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Validate date
  const validateDate = (dateStr: string): { isValid: boolean; error?: string } => {
    if (!dateStr) return { isValid: true };
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      if (dateStr.length > 0)
        return { isValid: false, error: 'Please use DD/MM/YYYY format (e.g., 25/12/2024)' };
      return { isValid: true };
    }

    const [dayStr, monthStr, yearStr] = dateStr.split('/');
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year))
      return { isValid: false, error: 'Invalid date. Please use DD/MM/YYYY format' };

    if (month < 1 || month > 12) return { isValid: false, error: 'Month must be between 01 and 12' };
    if (day < 1 || day > 31) return { isValid: false, error: 'Day must be between 01 and 31' };
    if (year < 1900 || year > 2100)
      return { isValid: false, error: 'Year must be between 1900 and 2100' };

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
      return { isValid: false, error: 'Invalid date. Please check the day and month' };

    return { isValid: true };
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const selectedDate = parseDate(value);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else {
      setCurrentMonth(new Date());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/[^\d/]/g, '');
    inputValue = inputValue.replace(/\/{2,}/g, '/');

    if (/^\d{3,}$/.test(inputValue.replaceAll('/', ''))) {
      const digits = inputValue.replaceAll('/', '');
      if (digits.length > 2 && digits.length <= 4) {
        inputValue = digits.slice(0, 2) + '/' + digits.slice(2);
      } else if (digits.length > 4) {
        inputValue = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
      }
    }

    if (inputValue.length > 10) inputValue = inputValue.slice(0, 10);

    onChange(inputValue);

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputValue)) {
      const validation = validateDate(inputValue);
      setError(validation.error || '');
    } else {
      setError('');
    }
  };

  const handleInputBlur = () => {
    if (value) {
      const parts = value.split('/');
      const day = (parts[0] || '').padStart(2, '0');
      const month = (parts[1] || '').padStart(2, '0');
      const year = (parts[2] || '').substring(0, 4);
      if (parts.length === 3 && year.length === 4) {
        const formatted = `${day}/${month}/${year}`;
        onChange(formatted);
        const validation = validateDate(formatted);
        setError(validation.error || '');
      }
    } else {
      setError('');
    }
  };

  const handleDateSelect = (date: Date) => {
    const formatted = formatDate(date);
    onChange(formatted);
    setError('');
    setIsOpen(false);
  };

  const goToPreviousMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    handleDateSelect(today);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++)
    calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) =>
    selectedDate &&
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {/* ✅ Updated styling to perfectly match other inputs */}
        <input
          type="text"
          required={required}
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pl-10 text-sm text-black dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-lg border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <button onClick={goToPreviousMonth} type="button" className="p-1 text-gray-600 hover:bg-gray-100 rounded-md">
              ‹
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={goToNextMonth} type="button" className="p-1 text-gray-600 hover:bg-gray-100 rounded-md">
              ›
            </button>
          </div>

          <div className="p-4">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) =>
                !date ? (
                  <div key={`empty-${index}`} className="h-9" />
                ) : (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    type="button"
                    className={`h-9 rounded-md text-sm font-medium transition-colors ${
                      isSelected(date)
                        ? 'bg-blue-600 text-white'
                        : isToday(date)
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="border-t p-3 flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={goToToday}
              type="button"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}