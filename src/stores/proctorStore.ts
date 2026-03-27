import { create } from 'zustand';
import type { ProctorStudentSummary, ProctorEvent } from '@/types/proctor.types';
import { proctorService } from '@/services/proctor.service';

interface ProctorStore {
  summary: ProctorStudentSummary[];
  studentEvents: ProctorEvent[];
  isLoading: boolean;
  error: string | null;

  fetchTestSummary: (testId: string) => Promise<void>;
  fetchStudentEvents: (testId: string, userId: string) => Promise<void>;
  toggleFlag: (eventId: string, flagged: boolean) => Promise<void>;
  clearError: () => void;
}

export const useProctorStore = create<ProctorStore>()((set) => ({
  summary: [],
  studentEvents: [],
  isLoading: false,
  error: null,

  fetchTestSummary: async (testId) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await proctorService.getTestSummary(testId);
      set({ summary, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchStudentEvents: async (testId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const studentEvents = await proctorService.getStudentEvents(testId, userId);
      set({ studentEvents, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  toggleFlag: async (eventId, flagged) => {
    try {
      await proctorService.toggleFlag(eventId, { flagged });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
