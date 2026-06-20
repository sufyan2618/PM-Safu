import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SuperAdmin } from '@/types';

interface AuthState {
  superAdmin: SuperAdmin | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while the app rehydrates the session from a persisted token on load. */
  isHydrating: boolean;
  setSession: (payload: { superAdmin: SuperAdmin; token: string }) => void;
  setToken: (token: string) => void;
  setSuperAdmin: (superAdmin: SuperAdmin) => void;
  setHydrating: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      superAdmin: null,
      token: null,
      isAuthenticated: false,
      isHydrating: true,
      setSession: ({ superAdmin, token }) =>
        set({ superAdmin, token, isAuthenticated: true, isHydrating: false }),
      setToken: (token) => set({ token, isAuthenticated: true }),
      setSuperAdmin: (superAdmin) => set({ superAdmin }),
      setHydrating: (value) => set({ isHydrating: value }),
      logout: () =>
        set({ superAdmin: null, token: null, isAuthenticated: false, isHydrating: false }),
    }),
    {
      name: 'admin-auth',
      // Only the token is persisted; the profile is rehydrated via /auth/me.
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
