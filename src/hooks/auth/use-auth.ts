'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth/auth-store';
import type { LoginInput, RegisterInput, ChangePasswordInput } from '@/types/auth';
import { ErrorCodes } from '@/types/api';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    hasCheckedAuth,
    setUser,
    setLoading,
    clearAuth,
    setHasCheckedAuth,
  } = useAuthStore();


  // Helper to check if we might have a token
  // Since cookies are httpOnly, we can't read them directly
  // So we use a localStorage flag that's set on login and cleared on logout
  const mightHaveToken = (): boolean => {
    if (typeof window === 'undefined') return false;
    // Check if we have a flag indicating we might be logged in
    // This is set when user logs in and cleared when they logout
    return localStorage.getItem('auth_checked') === 'true';
  };

  // Check auth status on mount (only once globally)
  useEffect(() => {
    // Skip if already checked
    if (hasCheckedAuth) return;
    
    // Skip if user is already authenticated
    if (isAuthenticated) {
      setHasCheckedAuth(true);
      setLoading(false);
      return;
    }
    
    // Check if we might have a token before making API call
    // If no flag exists, user is definitely not logged in - skip API call
    if (!mightHaveToken()) {
      // No token flag - user is definitely not logged in, skip API call
      setHasCheckedAuth(true);
      setLoading(false);
      clearAuth();
      return;
    }
    
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Mark that we're checking auth and set loading
        setHasCheckedAuth(true);
        setLoading(true);
        
        const response = await fetch('/api/v1/auth/me', {
          credentials: 'include',
        });

        if (!isMounted) return;

        // Treat any non-200 response as "logged out"
        if (response.ok && response.status === 200) {
          const data = await response.json();
          if (data.success && data.data) {
            setUser(data.data);
            setLoading(false);
            // Set flag indicating we have auth
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_checked', 'true');
            }
          } else {
            // API returned success but no data - treat as logged out
            clearAuth();
            // clearAuth already clears the flag, but ensure it's cleared
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_checked');
            }
          }
        } else {
          // Any non-200 response means user is not logged in
          // This includes 401, 403, 500, etc.
          clearAuth();
          // clearAuth already clears the flag, but ensure it's cleared
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_checked');
          }
        }
      } catch (error) {
        if (!isMounted) return;
        // Clear auth on error
        clearAuth();
        // clearAuth already clears the flag, but ensure it's cleared
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_checked');
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedAuth]);

  const login = async (input: LoginInput) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.code || ErrorCodes.INTERNAL_ERROR);
      }

      setUser(data.data.user);
      // Set flag indicating we have auth
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_checked', 'true');
      }
      return data.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.code || ErrorCodes.INTERNAL_ERROR);
      }

      setUser(data.data.user);
      // Set flag indicating we have auth
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_checked', 'true');
      }
      return data.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Reset auth check on logout so next visit will check again
      clearAuth(true);
      // Clear the flag
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_checked');
      }
    } catch (error) {
      // Clear auth even if logout fails
      clearAuth(true);
      // Clear the flag
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_checked');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.code || ErrorCodes.INVALID_TOKEN);
      }

      return data.data;
    } catch (error) {
      clearAuth();
      throw error;
    }
  };

  const changePassword = async (input: ChangePasswordInput) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.code || ErrorCodes.INTERNAL_ERROR);
      }

      return data.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = (): string | null => {
    // Tokens are now in cookies, not accessible from client
    // This is for backward compatibility only
    return null;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    hasCheckedAuth,
    login,
    register,
    logout,
    refreshToken,
    changePassword,
    getAccessToken,
  };
}

