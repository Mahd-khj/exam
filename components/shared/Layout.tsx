'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/types';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Define publicPaths at top-level so it’s visible everywhere
  const publicPaths: string[] = [
    '/login',
    '/signup',
    '/verify',
    '/forgot-password',
    '/reset-password',
  ];

  useEffect(() => {
    const currentUser = apiClient.getUser();
    setUser(currentUser);
    setLoading(false);

    // ✅ Type annotation for callback parameter (`path: string`)
    const isPublicPage = publicPaths.some((path: string) =>
      pathname?.includes(path)
    );

    // Redirect if not logged in and not on public page
    if (!currentUser && !isPublicPage) {
      router.push('/login');
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  // ✅ Allow rendering of public pages when user not logged in
  if (!user && pathname && publicPaths.some((path: string) => pathname.includes(path))) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin';
  const isStudent = user.role === 'student';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white shadow-sm dark:bg-gray-800 dark:border-b dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center space-x-3">
                <Image
                  src="/air-logo.png"
                  alt="App Logo"
                  width={150}
                  height={40}
                  priority
                />

                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Exam Schedule
                </h1>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {isAdmin && (
                  <>
                    <a
                      href="/admin/dashboard"
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        pathname?.includes('/admin/dashboard')
                          ? 'border-blue-500 text-gray-900 dark:text-blue-400 dark:border-blue-400 dark:text-gray-100'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      Dashboard
                    </a>
                    <a
                      href="/admin/exams"
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        pathname?.includes('/admin/exams')
                          ? 'border-blue-500 text-gray-900 dark:text-blue-400 dark:border-blue-400 dark:text-gray-100'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      Exams
                    </a>
                    <a
                      href="/admin/upload"
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        pathname?.includes('/admin/upload')
                          ? 'border-blue-500 text-gray-900 dark:text-blue-400 dark:border-blue-400 dark:text-gray-100'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      Upload CSV
                    </a>
                  </>
                )}
                {isStudent && (
                  <>
                    <a
                      href="/student/dashboard"
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        pathname?.includes('/student/dashboard')
                          ? 'border-blue-500 text-gray-900 dark:text-blue-400 dark:border-blue-400 dark:text-gray-100'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      Dashboard
                    </a>
                  </>
                )}
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <Image
              src="/Ai and informatics.png"
              alt="AI and Informatics"
              width={150}
              height={40}
            />

              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
