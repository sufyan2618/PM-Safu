import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompanySummary, User } from '@/types';

interface AuthState {
  user: User | null;
  company: CompanySummary | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while the initial /auth/me hydration is in flight on app boot. */
  isHydrating: boolean;
  setSession: (payload: { user: User; token: string; company: CompanySummary }) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setCompany: (company: CompanySummary) => void;
  updateUser: (patch: Partial<User>) => void;
  setHydrating: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      token: null,
      isAuthenticated: false,
      isHydrating: true,
      setSession: ({ user, token, company }) =>
        set({ user, token, company, isAuthenticated: true, isHydrating: false }),
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setCompany: (company) => set({ company }),
      updateUser: (patch) =>
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),
      setHydrating: (value) => set({ isHydrating: value }),
      logout: () =>
        set({ user: null, company: null, token: null, isAuthenticated: false, isHydrating: false }),
    }),
    {
      name: 'auth-storage',
      // Only persist the access token; user/company are re-hydrated via /auth/me.
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
