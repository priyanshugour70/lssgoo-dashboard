'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuth } from '@/hooks/auth/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/auth/login');
      return;
    }
    
    if (!isLoading && isAuthenticated && user) {
      // Check if user has dashboard.access permission OR admin/super-admin role
      const permissions = user.permissions || [];
      const roles = user.roles || [];
      
      // Check for dashboard.access permission
      const hasDashboardPermission = Array.isArray(permissions) && permissions.includes('dashboard.access');
      
      // Check for admin or super-admin role (roles are returned as string[] from API)
      const hasAdminRole = Array.isArray(roles) && roles.some((role: any) => {
        if (typeof role === 'string') {
          return role === 'admin' || role === 'super-admin';
        }
        // Handle object format (shouldn't happen with current API, but just in case)
        const roleSlug = role?.role?.slug || role?.slug || role;
        return roleSlug === 'admin' || roleSlug === 'super-admin';
      });
      
      if (!hasDashboardPermission && !hasAdminRole) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while checking auth or if user data isn't loaded yet
  if (isLoading || !isAuthenticated || !user || !user.roles || !user.permissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Check if user has dashboard.access permission OR admin/super-admin role
  const permissions = user.permissions || [];
  const roles = user.roles || [];
  
  // Check for dashboard.access permission
  const hasDashboardPermission = Array.isArray(permissions) && permissions.includes('dashboard.access');
  
  // Check for admin or super-admin role (roles are returned as string[] from API)
  const hasAdminRole = Array.isArray(roles) && roles.some((role: any) => {
    if (typeof role === 'string') {
      return role === 'admin' || role === 'super-admin';
    }
    // Handle object format (shouldn't happen with current API, but just in case)
    const roleSlug = role?.role?.slug || role?.slug || role;
    return roleSlug === 'admin' || roleSlug === 'super-admin';
  });

  if (!hasDashboardPermission && !hasAdminRole) {
    return null; // Will redirect
  }

  return <AdminLayout>{children}</AdminLayout>;
}
