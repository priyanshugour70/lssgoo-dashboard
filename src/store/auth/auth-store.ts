'use client';

import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedAuth: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: (resetCheck?: boolean) => void;
  setHasCheckedAuth: (checked: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  hasCheckedAuth: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: (resetCheck = false) => {
    // Clear any localStorage items if needed
    if (typeof window !== 'undefined') {
      // Clear any auth-related localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('auth_checked');
    }
    set({
      user: null,
      isAuthenticated: false,
      // If resetCheck is true (e.g., on logout), reset hasCheckedAuth
      // Otherwise keep it true (e.g., on 401 - we've already checked)
      hasCheckedAuth: resetCheck ? false : true,
      isLoading: false,
    });
  },
  setHasCheckedAuth: (hasCheckedAuth) => set({ hasCheckedAuth }),
}));

