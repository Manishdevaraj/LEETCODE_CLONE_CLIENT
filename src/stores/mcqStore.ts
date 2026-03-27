import { create } from 'zustand';
import type { McqCategory } from '@/types/mcq.types';
import { mcqService } from '@/services/mcq.service';

interface McqStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questions: any[];
  categories: McqCategory[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  fetchQuestions: (params?: Parameters<typeof mcqService.getQuestions>[0]) => Promise<void>;
  createCategory: (payload: Parameters<typeof mcqService.createCategory>[0]) => Promise<void>;
  updateCategory: (id: string, payload: Parameters<typeof mcqService.updateCategory>[1]) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createQuestion: (payload: Parameters<typeof mcqService.createQuestion>[0]) => Promise<void>;
  updateQuestion: (id: string, payload: Parameters<typeof mcqService.updateQuestion>[1]) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useMcqStore = create<McqStore>()((set) => ({
  questions: [],
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    try {
      const categories = await mcqService.getCategories();
      set({ categories });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  fetchQuestions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const questions = await mcqService.getQuestions(params);
      set({ questions, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createCategory: async (payload) => {
    try {
      await mcqService.createCategory(payload);
      const categories = await mcqService.getCategories();
      set({ categories });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  updateCategory: async (id, payload) => {
    try {
      await mcqService.updateCategory(id, payload);
      const categories = await mcqService.getCategories();
      set({ categories });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  deleteCategory: async (id) => {
    try {
      await mcqService.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  createQuestion: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await mcqService.createQuestion(payload);
      const questions = await mcqService.getQuestions();
      set({ questions, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateQuestion: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await mcqService.updateQuestion(id, payload);
      const questions = await mcqService.getQuestions();
      set({ questions, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteQuestion: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await mcqService.deleteQuestion(id);
      set((state) => ({
        questions: state.questions.filter((q: { id: string }) => q.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
