import { create } from 'zustand';
import type { Role, Permission, PageAccess } from '@/types/role.types';
import { roleService } from '@/services/role.service';

interface RoleStore {
  roles: Role[];
  allPermissions: Permission[];
  allPageAccess: PageAccess[];
  isLoading: boolean;
  error: string | null;

  fetchRoles: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchPageAccess: () => Promise<void>;
  createRole: (payload: Parameters<typeof roleService.create>[0]) => Promise<void>;
  updateRole: (id: string, payload: Parameters<typeof roleService.update>[1]) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  updatePermissions: (roleId: string, permissionIds: string[]) => Promise<void>;
  updatePageAccess: (roleId: string, pageAccessIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useRoleStore = create<RoleStore>()((set) => ({
  roles: [],
  allPermissions: [],
  allPageAccess: [],
  isLoading: false,
  error: null,

  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const roles = await roleService.getAll();
      set({ roles, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchPermissions: async () => {
    try {
      const allPermissions = await roleService.getAllPermissions();
      set({ allPermissions });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  fetchPageAccess: async () => {
    try {
      const allPageAccess = await roleService.getAllPageAccess();
      set({ allPageAccess });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  createRole: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await roleService.create(payload);
      const roles = await roleService.getAll();
      set({ roles, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateRole: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await roleService.update(id, payload);
      const roles = await roleService.getAll();
      set({ roles, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await roleService.delete(id);
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updatePermissions: async (roleId, permissionIds) => {
    try {
      await roleService.updatePermissions(roleId, permissionIds);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  updatePageAccess: async (roleId, pageAccessIds) => {
    try {
      await roleService.updatePageAccess(roleId, pageAccessIds);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
