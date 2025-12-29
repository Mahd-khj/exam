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

  // Validate date format and check if it's a valid date
  const validateDate = (dateStr: string): { isValid: boolean; error?: string } => {
    if (!dateStr) return { isValid: true }; // Empty is OK (will be validated by required prop)
    
    // Check format DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      if (dateStr.length > 0) {
        return { isValid: false, error: 'Please use DD/MM/YYYY format (e.g., 25/12/2024)' };
      }
      return { isValid: true };
    }
    
    const [dayStr, monthStr, yearStr] = dateStr.split('/');
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    // Check if numbers are valid
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { isValid: false, error: 'Invalid date. Please use DD/MM/YYYY format' };
    }
    
    // Validate ranges
    if (month < 1 || month > 12) {
      return { isValid: false, error: 'Month must be between 01 and 12' };
    }
    
    if (day < 1 || day > 31) {
      return { isValid: false, error: 'Day must be between 01 and 31' };
    }
    
    if (year < 1900 || year > 2100) {
      return { isValid: false, error: 'Year must be between 1900 and 2100' };
    }
    
    // Check if date is actually valid (e.g., 31/02/2024 is invalid)
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return { isValid: false, error: 'Invalid date. Please check the day and month' };
    }
    
    return { isValid: true };
  };

  // Parse DD/MM/YYYY to Date object
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    // Verify it's a valid date
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date;
  };

  // Format Date to DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const selectedDate = parseDate(value);


  // Update current month when value changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else {
      setCurrentMonth(new Date());
    }
  }, [value]);

  // Close on outside click
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

  const handleDateSelect = (date: Date) => {
    const formatted = formatDate(date);
    onChange(formatted);
    setError(''); // Clear any errors when selecting from calendar
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    handleDateSelect(today);
  };

  // Get days in month
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  // Generate calendar days
  const calendarDays: (Date | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
  }

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove invalid characters, keep digits and slashes
    inputValue = inputValue.replace(/[^\d/]/g, '');
    
    // If input has slashes, preserve them (user is editing existing date)
    // If no slashes, auto-add them as user types
    let formatted = inputValue;
    
    if (!inputValue.includes('/')) {
      // No slashes yet - auto-add them
      const digitsOnly = inputValue;
      if (digitsOnly.length > 2 && digitsOnly.length <= 4) {
        formatted = digitsOnly.substring(0, 2) + '/' + digitsOnly.substring(2);
      } else if (digitsOnly.length > 4) {
        formatted = digitsOnly.substring(0, 2) + '/' + 
                   digitsOnly.substring(2, 4) + '/' + 
                   digitsOnly.substring(4);
      } else {
        formatted = digitsOnly;
      }
    } else {
      // Has slashes - preserve structure, limit section lengths but allow typing
      const parts = inputValue.split('/');
      const day = (parts[0] || '').substring(0, 2);
      const month = (parts[1] || '').substring(0, 2);
      const year = (parts[2] || ''); // Allow year to be longer while typing, will validate later
      
      formatted = day;
      if (parts.length > 1 || month || year) formatted += '/' + month;
      if (parts.length > 2 || year) formatted += '/' + year;
    }
    
    onChange(formatted);
    
    // Validate if complete (exactly DD/MM/YYYY format)
    if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const validation = validateDate(formatted);
      setError(validation.error || '');
    } else {
      setError('');
    }
  };

  const handleInputBlur = () => {
    // Add leading zeros and limit year to 4 digits when user leaves the field
    if (value) {
      const parts = value.split('/');
      const day = (parts[0] || '').padStart(2, '0');
      const month = (parts[1] || '').padStart(2, '0');
      const year = (parts[2] || '').substring(0, 4); // Limit year to 4 digits
      
      if (parts.length >= 3 && year.length === 4) {
        // Complete date - format with leading zeros
        const formatted = `${day}/${month}/${year}`;
        onChange(formatted);
        
        // Validate
        const validation = validateDate(formatted);
        setError(validation.error || '');
      } else if (day !== '00' || month !== '00' || year) {
        // Partial date - format what we have with leading zeros
        let formatted = '';
        if (day !== '00') formatted = day;
        if (month !== '00') formatted = formatted ? formatted + '/' + month : month;
        if (year) formatted = formatted ? formatted + '/' + year : '/' + year;
        if (formatted !== value) {
          onChange(formatted);
        }
      }
    } else {
      setError('');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow natural typing - no special handling needed
    // Slashes will be auto-added in handleInputChange
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onClick={() => setIsOpen(true)}
          placeholder="DD/MM/YYYY"
          className={`mt-1 block w-full rounded-md border px-3 py-2 pl-10 text-black dark:text-gray-100 shadow-sm focus:outline-none focus:ring-1 ${
            error
              ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-500 bg-white dark:bg-gray-700'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'
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

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={goToPreviousMonth}
              className="rounded-md p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={goToNextMonth}
              className="rounded-md p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day names header */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-9" />;
                }

                const today = isToday(date);
                const selected = isSelected(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    type="button"
                    className={`
                      h-9 rounded-md text-sm font-medium transition-colors
                      ${selected
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : today
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer with Today button */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={goToToday}
              type="button"
              className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

