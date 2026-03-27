import { create } from 'zustand';
import type { College, Department } from '@/types/college.types';
import { collegeService } from '@/services/college.service';

interface CollegeStore {
  colleges: College[];
  departments: Department[];
  isLoading: boolean;
  error: string | null;

  fetchColleges: () => Promise<void>;
  fetchDepartments: (collegeId: string) => Promise<void>;
  createCollege: (payload: Parameters<typeof collegeService.create>[0]) => Promise<void>;
  updateCollege: (id: string, payload: Parameters<typeof collegeService.update>[1]) => Promise<void>;
  deleteCollege: (id: string) => Promise<void>;
  createDepartment: (collegeId: string, payload: Parameters<typeof collegeService.createDepartment>[1]) => Promise<void>;
  updateDepartment: (id: string, payload: Parameters<typeof collegeService.updateDepartment>[1]) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCollegeStore = create<CollegeStore>()((set) => ({
  colleges: [],
  departments: [],
  isLoading: false,
  error: null,

  fetchColleges: async () => {
    set({ isLoading: true, error: null });
    try {
      const colleges = await collegeService.getAll();
      set({ colleges, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchDepartments: async (collegeId) => {
    try {
      const departments = await collegeService.getDepartments(collegeId);
      set({ departments });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  createCollege: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await collegeService.create(payload);
      const colleges = await collegeService.getAll();
      set({ colleges, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateCollege: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await collegeService.update(id, payload);
      const colleges = await collegeService.getAll();
      set({ colleges, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteCollege: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await collegeService.delete(id);
      set((state) => ({
        colleges: state.colleges.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createDepartment: async (collegeId, payload) => {
    try {
      await collegeService.createDepartment(collegeId, payload);
      const departments = await collegeService.getDepartments(collegeId);
      set({ departments });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  updateDepartment: async (id, payload) => {
    try {
      await collegeService.updateDepartment(id, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  deleteDepartment: async (id) => {
    try {
      await collegeService.deleteDepartment(id);
      set((state) => ({
        departments: state.departments.filter((d) => d.id !== id),
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
