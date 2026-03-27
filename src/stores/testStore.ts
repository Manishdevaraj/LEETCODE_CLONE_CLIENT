import { create } from 'zustand';
import type { Test, TestCategory } from '@/types/test.types';
import { testService } from '@/services/test.service';
import { testCategoryService } from '@/services/test-category.service';

interface TestStore {
  tests: Test[];
  categories: TestCategory[];
  isLoading: boolean;
  error: string | null;

  fetchTests: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createTest: (payload: Parameters<typeof testService.create>[0]) => Promise<Test>;
  updateTest: (id: string, payload: Parameters<typeof testService.update>[1]) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  addQuestion: (testId: string, payload: Parameters<typeof testService.addQuestion>[1]) => Promise<void>;
  removeQuestion: (testId: string, testQuestionId: string) => Promise<void>;
  autoGenerate: (testId: string, rules: Parameters<typeof testService.autoGenerate>[1]) => Promise<void>;
  assignBatches: (testId: string, payload: Parameters<typeof testService.assignBatches>[1]) => Promise<void>;
  unassignBatch: (testId: string, batchId: string) => Promise<void>;
  createCategory: (payload: Parameters<typeof testCategoryService.create>[0]) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTestStore = create<TestStore>()((set) => ({
  tests: [],
  categories: [],
  isLoading: false,
  error: null,

  fetchTests: async () => {
    set({ isLoading: true, error: null });
    try {
      const tests = await testService.getAll();
      set({ tests, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await testCategoryService.getAll();
      set({ categories });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  createTest: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const test = await testService.create(payload);
      const tests = await testService.getAll();
      set({ tests, isLoading: false });
      return test;
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  updateTest: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await testService.update(id, payload);
      const tests = await testService.getAll();
      set({ tests, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteTest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await testService.delete(id);
      set((state) => ({
        tests: state.tests.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateStatus: async (id, status) => {
    try {
      await testService.updateStatus(id, status);
      set((state) => ({
        tests: state.tests.map((t) => (t.id === id ? { ...t, status: status as Test['status'] } : t)),
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  addQuestion: async (testId, payload) => {
    try {
      await testService.addQuestion(testId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  removeQuestion: async (testId, testQuestionId) => {
    try {
      await testService.removeQuestion(testId, testQuestionId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  autoGenerate: async (testId, rules) => {
    try {
      await testService.autoGenerate(testId, rules);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  assignBatches: async (testId, payload) => {
    try {
      await testService.assignBatches(testId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  unassignBatch: async (testId, batchId) => {
    try {
      await testService.unassignBatch(testId, batchId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  createCategory: async (payload) => {
    try {
      await testCategoryService.create(payload);
      const categories = await testCategoryService.getAll();
      set({ categories });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  deleteCategory: async (id) => {
    try {
      await testCategoryService.delete(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
