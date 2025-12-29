'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = apiClient.getUser();
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'student') {
        router.push('/student/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg text-gray-500">Loading...</div>
    </div>
  );
}
