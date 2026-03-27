import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('token'),
      isLoading: true,

      login: async (email, password) => {
        const data = await authService.login({ email, password });
        localStorage.setItem('token', data.access_token);
        set({ token: data.access_token });
        // Login response lacks permissions/pageAccess — fetch full profile
        const user = await authService.getMe();
        set({ user });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },

      loadUser: async () => {
        const token = get().token;
        if (!token) {
          set({ isLoading: false });
          return;
        }
        try {
          const user = await authService.getMe();
          set({ user, isLoading: false });
        } catch {
          localStorage.removeItem('token');
          set({ token: null, user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
