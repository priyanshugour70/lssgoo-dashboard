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
  clearAuth: () => void;
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
  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      hasCheckedAuth: false,
    }),
  setHasCheckedAuth: (hasCheckedAuth) => set({ hasCheckedAuth }),
}));

