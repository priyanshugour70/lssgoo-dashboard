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

  // Check auth status on mount (only once globally)
  useEffect(() => {
    // Skip if already checked or currently loading
    if (hasCheckedAuth || isLoading) return;
    
    // Skip if user is already authenticated
    if (isAuthenticated) {
      setHasCheckedAuth(true);
      return;
    }
    
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        setHasCheckedAuth(true);
        setLoading(true);
        const response = await fetch('/api/v1/auth/me', {
          credentials: 'include',
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUser(data.data);
          } else {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        if (!isMounted) return;
        clearAuth();
      } finally {
        if (isMounted) {
          setLoading(false);
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

      clearAuth();
    } catch (error) {
      // Clear auth even if logout fails
      clearAuth();
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
    login,
    register,
    logout,
    refreshToken,
    changePassword,
    getAccessToken,
  };
}

