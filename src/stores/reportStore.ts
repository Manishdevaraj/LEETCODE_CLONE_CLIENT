import { create } from 'zustand';
import { reportService } from '@/services/report.service';

interface ReportStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reportData: any;
  isLoading: boolean;
  error: string | null;

  fetchTestReport: (testId: string) => Promise<void>;
  fetchTestParticipation: (testId: string) => Promise<void>;
  fetchBatchReport: (batchId: string) => Promise<void>;
  fetchCollegeComparison: () => Promise<void>;
  fetchStudentReport: (studentId: string) => Promise<void>;
  fetchCourseProgressReport: (courseId: string) => Promise<void>;
  fetchTrends: (period: string) => Promise<void>;
  downloadExcel: (url: string) => Promise<Blob>;
  clearError: () => void;
}

export const useReportStore = create<ReportStore>()((set) => ({
  reportData: null,
  isLoading: false,
  error: null,

  fetchTestReport: async (testId) => {
    set({ isLoading: true, error: null });
    try {
      const reportData = await reportService.getTestReport(testId);
      set({ reportData, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTestParticipation: async (testId) => {
    set({ isLoading: true, error: null });
    try {
      const reportData = await reportService.getTestParticipation(testId);
      set({ reportData, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchBatchReport: async (batchId) => {
    set({ isLoading: true, error: null });
    try {
      const reportData = await reportService.getBatchReport(batchId);
      set({ reportData, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchCollegeComparison: async () => {
    set({ isLoading: true, error: null });
    try {
      const reportData = await reportService.getCollegeComparison();
      set({ reportData, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchStudentReport: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const reportData = await reportService.getStudentReport(studentId);
      set({ reportData, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchCourseProgressReport: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const reportData = await reportService.getCourseProgressReport(courseId);
      set({ reportData, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTrends: async (period) => {
    set({ isLoading: true, error: null });
    try {
      const reportData = await reportService.getTrends(period);
      set({ reportData, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  downloadExcel: async (url) => {
    return await reportService.downloadExcel(url);
  },

  clearError: () => set({ error: null }),
}));
