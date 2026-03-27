import { create } from 'zustand';
import { courseProgressService } from '@/services/course-progress.service';
import type {
  CourseProgressSummary,
  CourseProgressDetail,
} from '@/types/course.types';

interface CourseProgressStore {
  myCourses: CourseProgressSummary[];
  currentProgress: CourseProgressDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchMyCourses: () => Promise<void>;
  fetchCourseProgress: (courseId: string) => Promise<void>;
  markContentComplete: (courseId: string, contentId: string) => Promise<void>;
  markPracticeComplete: (courseId: string, practiceQuestionId: string) => Promise<void>;
  clearError: () => void;
}

export const useCourseProgressStore = create<CourseProgressStore>()((set, get) => ({
  myCourses: [],
  currentProgress: null,
  isLoading: false,
  error: null,

  fetchMyCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const myCourses = await courseProgressService.getMyCourses();
      set({ myCourses, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchCourseProgress: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgress = await courseProgressService.getCourseProgress(courseId);
      set({ currentProgress, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  markContentComplete: async (courseId: string, contentId: string) => {
    try {
      await courseProgressService.completeContent(courseId, contentId);
      // Re-fetch progress to get updated completion state
      const currentProgress = get().currentProgress;
      if (currentProgress) {
        const updated = await courseProgressService.getCourseProgress(courseId);
        set({ currentProgress: updated });
      }
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  markPracticeComplete: async (courseId: string, practiceQuestionId: string) => {
    try {
      await courseProgressService.completePracticeQuestion(courseId, practiceQuestionId);
      const currentProgress = get().currentProgress;
      if (currentProgress) {
        const updated = await courseProgressService.getCourseProgress(courseId);
        set({ currentProgress: updated });
      }
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
