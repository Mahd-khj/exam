'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import type { Exam } from '@/lib/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await apiClient.getExams();
      if (response.success && response.exams) {
        setAllExams(response.exams);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate exams into recent (past) and upcoming
  const { recentExams, upcomingExams } = useMemo(() => {
    const now = new Date();
    const recent: Exam[] = [];
    const upcoming: Exam[] = [];

    // Helper function to get date string for a day offset (0 = today, -1 = yesterday, etc.)
    // Uses local date formatting to match exam.date format
    const getDateString = (daysOffset: number): string => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysOffset);
      // Format as YYYY-MM-DD using local time (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const yesterday = getDateString(-1);
    const today = getDateString(0);
    const tomorrow = getDateString(1);
    const dayAfterTomorrow = getDateString(2);

    allExams.forEach((exam) => {
      try {
        const examDateTime = new Date(`${exam.date}T${exam.endTime}`);
        if (!isNaN(examDateTime.getTime())) {
          if (examDateTime < now) {
            recent.push(exam);
          } else {
            upcoming.push(exam);
          }
        }
      } catch (error) {
        console.warn('Failed to parse exam date:', exam.date, exam.endTime);
      }
    });

    // Filter recent exams to only show yesterday's exams
    const yesterdayExams = recent.filter(exam => exam.date === yesterday);
    yesterdayExams.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.endTime}`);
      const dateB = new Date(`${b.date}T${b.endTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    // Filter upcoming exams to show all exams from next 2 days
    // Priority: today's exams, then tomorrow's exams
    // If no exams in next 2 days, find the first 2 days that have exams
    const todayExamsList = upcoming.filter(exam => exam.date === today);
    const tomorrowExamsList = upcoming.filter(exam => exam.date === tomorrow);
    const dayAfterExamsList = upcoming.filter(exam => exam.date === dayAfterTomorrow);

    let selectedUpcoming: Exam[] = [];
    
    // First, try today + tomorrow
    if (todayExamsList.length > 0) {
      selectedUpcoming = [...todayExamsList, ...tomorrowExamsList];
    } 
    // If no exams today, try tomorrow + day after
    else if (tomorrowExamsList.length > 0) {
      selectedUpcoming = [...tomorrowExamsList, ...dayAfterExamsList];
    }
    // If no exams in next 2 days, search forward to find first 2 days with exams
    else {
      // Find all unique dates that have exams, sorted
      const examDates = [...new Set(upcoming.map(exam => exam.date))].sort();
      
      if (examDates.length > 0) {
        // Get first day with exams
        const firstDay = examDates[0];
        const firstDayExams = upcoming.filter(exam => exam.date === firstDay);
        
        // Find the next day with exams (could be consecutive or not)
        let secondDay = null;
        for (let i = 1; i < examDates.length; i++) {
          secondDay = examDates[i];
          break; // Take the next available day
        }
        
        if (secondDay) {
          const secondDayExams = upcoming.filter(exam => exam.date === secondDay);
          selectedUpcoming = [...firstDayExams, ...secondDayExams];
        } else {
          // Only one day has exams, show just that day
          selectedUpcoming = firstDayExams;
        }
      }
    }

    // Sort upcoming exams by date and time (soonest first)
    selectedUpcoming.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      recentExams: yesterdayExams, // Show only yesterday's exams
      upcomingExams: selectedUpcoming, // Show all exams from next 2 days
    };
  }, [allExams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome to the exam schedule management system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/exams/new"
              className="block rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              Create New Exam
            </Link>
            <Link
              href="/admin/upload"
              className="block rounded-md bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
            >
              Upload CSV
            </Link>
            <Link
              href="/admin/exams"
              className="block rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              View All Exams
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900 sm:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Exams</h3>
            <Link
              href="/admin/exams"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="mt-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : recentExams.length === 0 ? (
            <div className="mt-4 text-center text-gray-500 dark:text-gray-400">No recent exams found</div>
          ) : (
            <div className="mt-4 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {recentExams.map((exam) => (
                    <tr key={exam.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {exam.title || exam.ClassCode?.code || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {exam.date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {exam.startTime} - {exam.endTime}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                          Past
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Exams Section */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Exams</h3>
          <Link
            href="/admin/exams"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">Loading...</div>
        ) : upcomingExams.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">No upcoming exams found</div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {upcomingExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      <Link
                        href={`/admin/exams/${exam.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {exam.title || exam.ClassCode?.code || 'N/A'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {exam.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {exam.startTime} - {exam.endTime}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {exam.Room?.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                        Upcoming
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
