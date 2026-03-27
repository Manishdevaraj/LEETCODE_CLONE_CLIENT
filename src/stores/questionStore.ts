import { create } from 'zustand';
import type { QuestionSummary, Question } from '@/types/question.types';
import { questionService } from '@/services/question.service';

interface QuestionStore {
  questions: QuestionSummary[];
  selectedQuestion: Question | null;
  isLoading: boolean;
  error: string | null;
  fetchQuestions: () => Promise<void>;
  fetchQuestion: (id: string) => Promise<void>;
  createQuestion: (payload: Parameters<typeof questionService.create>[0]) => Promise<void>;
  updateQuestion: (id: string, payload: Parameters<typeof questionService.update>[1]) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useQuestionStore = create<QuestionStore>()((set) => ({
  questions: [],
  selectedQuestion: null,
  isLoading: false,
  error: null,

  fetchQuestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const questions = await questionService.getAll();
      set({ questions, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchQuestion: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const question = await questionService.getById(id);
      set({ selectedQuestion: question, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createQuestion: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await questionService.create(payload);
      const questions = await questionService.getAll();
      set({ questions, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateQuestion: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await questionService.update(id, payload);
      const questions = await questionService.getAll();
      set({ questions, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteQuestion: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await questionService.delete(id);
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
