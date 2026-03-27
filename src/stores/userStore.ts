import { create } from 'zustand';
import type { User, UsersResponse } from '@/types/user.types';
import { userService } from '@/services/user.service';

interface UserStore {
  users: User[];
  total: number;
  isLoading: boolean;
  error: string | null;

  fetchUsers: (params: Parameters<typeof userService.getAll>[0]) => Promise<void>;
  createUser: (payload: Parameters<typeof userService.create>[0]) => Promise<void>;
  changeRole: (userId: string, payload: Parameters<typeof userService.changeRole>[1]) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  clearError: () => void;
}

export const useUserStore = create<UserStore>()((set) => ({
  users: [],
  total: 0,
  isLoading: false,
  error: null,

  fetchUsers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response: UsersResponse = await userService.getAll(params);
      set({ users: response.users, total: response.total, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createUser: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await userService.create(payload);
      set({ isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  changeRole: async (userId, payload) => {
    try {
      await userService.changeRole(userId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  deleteUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      await userService.delete(userId);
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
        total: state.total - 1,
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  searchUsers: async (query) => {
    try {
      return await userService.searchUsers(query);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));
