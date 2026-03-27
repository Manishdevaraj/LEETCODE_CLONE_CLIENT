import { create } from 'zustand';
import type { Course } from '@/types/course.types';
import { courseService } from '@/services/course.service';

interface CourseStore {
  courses: Course[];
  editCourse: Course | null;
  isLoading: boolean;
  error: string | null;

  fetchCourses: () => Promise<void>;
  fetchCourse: (id: string) => Promise<void>;
  createCourse: (payload: Parameters<typeof courseService.create>[0]) => Promise<Course>;
  updateCourse: (id: string, payload: Parameters<typeof courseService.update>[1]) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addDay: (courseId: string, payload: Parameters<typeof courseService.addDay>[1]) => Promise<void>;
  updateDay: (dayId: string, payload: Parameters<typeof courseService.updateDay>[1]) => Promise<void>;
  deleteDay: (dayId: string) => Promise<void>;
  addContent: (dayId: string, payload: Parameters<typeof courseService.addContent>[1]) => Promise<void>;
  updateContent: (contentId: string, payload: Parameters<typeof courseService.updateContent>[1]) => Promise<void>;
  deleteContent: (contentId: string) => Promise<void>;
  assignBatches: (courseId: string, payload: Parameters<typeof courseService.assignBatches>[1]) => Promise<void>;
  unassignBatch: (courseId: string, batchId: string) => Promise<void>;
  clearError: () => void;
  setEditCourse: (course: Course | null) => void;
}

export const useCourseStore = create<CourseStore>()((set, get) => ({
  courses: [],
  editCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const courses = await courseService.getAll();
      set({ courses, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseService.getById(id);
      set({ editCourse: course as unknown as Course, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createCourse: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseService.create(payload);
      const courses = await courseService.getAll();
      set({ courses, isLoading: false });
      return course;
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  updateCourse: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await courseService.update(id, payload);
      const courses = await courseService.getAll();
      set({ courses, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await courseService.delete(id);
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addDay: async (courseId, payload) => {
    try {
      await courseService.addDay(courseId, payload);
      await get().fetchCourse(courseId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  updateDay: async (dayId, payload) => {
    try {
      await courseService.updateDay(dayId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  deleteDay: async (dayId) => {
    try {
      await courseService.deleteDay(dayId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  addContent: async (dayId, payload) => {
    try {
      await courseService.addContent(dayId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  updateContent: async (contentId, payload) => {
    try {
      await courseService.updateContent(contentId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  deleteContent: async (contentId) => {
    try {
      await courseService.deleteContent(contentId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  assignBatches: async (courseId, payload) => {
    try {
      await courseService.assignBatches(courseId, payload);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  unassignBatch: async (courseId, batchId) => {
    try {
      await courseService.unassignBatch(courseId, batchId);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
  setEditCourse: (course) => set({ editCourse: course }),
}));
