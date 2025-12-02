'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuth } from '@/hooks/auth/use-auth';

export default function RegisterPage() {
  const { isAuthenticated, isLoading, hasCheckedAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth check is complete and user is authenticated
    if (hasCheckedAuth && !isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, hasCheckedAuth, router]);

  // Show loading only while checking auth
  // hasCheckedAuth: false means we haven't checked yet
  // isLoading: true means we're currently checking
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  // If authenticated, redirect (handled by useEffect above)
  if (isAuthenticated) {
    return null;
  }

  // Auth check is complete and user is not authenticated - show register form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <RegisterForm />
    </div>
  );
}
