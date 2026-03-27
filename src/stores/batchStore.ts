import { create } from 'zustand';
import type { Batch, BatchDetail } from '@/types/batch.types';
import { batchService } from '@/services/batch.service';

interface BatchStore {
  batches: Batch[];
  selectedBatch: BatchDetail | null;
  isLoading: boolean;
  error: string | null;

  fetchBatches: () => Promise<void>;
  fetchByDepartment: (departmentId: string) => Promise<void>;
  fetchBatch: (id: string) => Promise<void>;
  createBatch: (departmentId: string, payload: Parameters<typeof batchService.create>[1]) => Promise<void>;
  updateBatch: (id: string, payload: Parameters<typeof batchService.update>[1]) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  addStudents: (batchId: string, payload: Parameters<typeof batchService.addStudents>[1]) => Promise<void>;
  removeStudent: (batchId: string, userId: string) => Promise<void>;
  addTeachers: (batchId: string, payload: Parameters<typeof batchService.addTeachers>[1]) => Promise<void>;
  removeTeacher: (batchId: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useBatchStore = create<BatchStore>()((set) => ({
  batches: [],
  selectedBatch: null,
  isLoading: false,
  error: null,

  fetchBatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const batches = await batchService.getAll();
      set({ batches, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchByDepartment: async (departmentId) => {
    set({ isLoading: true, error: null });
    try {
      const batches = await batchService.getByDepartment(departmentId);
      set({ batches, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchBatch: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const batch = await batchService.getById(id);
      set({ selectedBatch: batch, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createBatch: async (departmentId, payload) => {
    set({ isLoading: true, error: null });
    try {
      await batchService.create(departmentId, payload);
      const batches = await batchService.getAll();
      set({ batches, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateBatch: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await batchService.update(id, payload);
      const batches = await batchService.getAll();
      set({ batches, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteBatch: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await batchService.delete(id);
      set((state) => ({
        batches: state.batches.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addStudents: async (batchId, payload) => {
    try {
      await batchService.addStudents(batchId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  removeStudent: async (batchId, userId) => {
    try {
      await batchService.removeStudent(batchId, userId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  addTeachers: async (batchId, payload) => {
    try {
      await batchService.addTeachers(batchId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  removeTeacher: async (batchId, userId) => {
    try {
      await batchService.removeTeacher(batchId, userId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
