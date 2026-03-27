import apiClient from '@/lib/axios';
import type {
  Course,
  CourseDetail,
  CourseCreatePayload,
  CourseUpdatePayload,
  CourseDayPayload,
  CourseDay,
  CourseContentPayload,
  ContentItem,
  CourseBatchAssignPayload,
  CourseSubModule,
  CreateSubModulePayload,
  UpdateSubModulePayload,
  AddPracticeQuestionPayload,
  PracticeQuestionItem,
} from '@/types/course.types';

export const courseService = {
  // ── Course CRUD ────────────────────────────────────────────────

  async getAll(): Promise<Course[]> {
    const { data } = await apiClient.get<Course[]>('/courses');
    return data;
  },

  async getById(id: string): Promise<CourseDetail> {
    const { data } = await apiClient.get<CourseDetail>(`/courses/${id}`);
    return data;
  },

  async create(payload: CourseCreatePayload): Promise<Course> {
    const { data } = await apiClient.post<Course>('/courses', payload);
    return data;
  },

  async update(id: string, payload: CourseUpdatePayload): Promise<Course> {
    const { data } = await apiClient.patch<Course>(`/courses/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  },

  // ── Day CRUD ───────────────────────────────────────────────────

  async addDay(courseId: string, payload: CourseDayPayload): Promise<CourseDay> {
    const { data } = await apiClient.post<CourseDay>(`/courses/${courseId}/days`, payload);
    return data;
  },

  async updateDay(dayId: string, payload: CourseDayPayload): Promise<CourseDay> {
    const { data } = await apiClient.patch<CourseDay>(`/courses/days/${dayId}`, payload);
    return data;
  },

  async deleteDay(dayId: string): Promise<void> {
    await apiClient.delete(`/courses/days/${dayId}`);
  },

  // ── Sub-Module CRUD ────────────────────────────────────────────

  async addSubModule(dayId: string, payload: CreateSubModulePayload): Promise<CourseSubModule> {
    const { data } = await apiClient.post<CourseSubModule>(
      `/courses/days/${dayId}/sub-modules`,
      payload,
    );
    return data;
  },

  async updateSubModule(subModuleId: string, payload: UpdateSubModulePayload): Promise<CourseSubModule> {
    const { data } = await apiClient.patch<CourseSubModule>(
      `/courses/sub-modules/${subModuleId}`,
      payload,
    );
    return data;
  },

  async deleteSubModule(subModuleId: string): Promise<void> {
    await apiClient.delete(`/courses/sub-modules/${subModuleId}`);
  },

  // ── Content CRUD (under sub-module) ────────────────────────────

  async addContent(subModuleId: string, payload: CourseContentPayload): Promise<ContentItem> {
    const { data } = await apiClient.post<ContentItem>(
      `/courses/sub-modules/${subModuleId}/content`,
      payload,
    );
    return data;
  },

  async updateContent(contentId: string, payload: Partial<CourseContentPayload>): Promise<ContentItem> {
    const { data } = await apiClient.patch<ContentItem>(
      `/courses/content/${contentId}`,
      payload,
    );
    return data;
  },

  async deleteContent(contentId: string): Promise<void> {
    await apiClient.delete(`/courses/content/${contentId}`);
  },

  // ── Practice Questions ─────────────────────────────────────────

  async addPracticeQuestion(subModuleId: string, payload: AddPracticeQuestionPayload): Promise<PracticeQuestionItem> {
    const { data } = await apiClient.post<PracticeQuestionItem>(
      `/courses/sub-modules/${subModuleId}/practice-questions`,
      payload,
    );
    return data;
  },

  async removePracticeQuestion(practiceQuestionId: string): Promise<void> {
    await apiClient.delete(`/courses/practice-questions/${practiceQuestionId}`);
  },

  // ── Batch assignment ───────────────────────────────────────────

  async assignBatches(courseId: string, payload: CourseBatchAssignPayload): Promise<void> {
    await apiClient.post(`/courses/${courseId}/assign`, payload);
  },

  async unassignBatch(courseId: string, batchId: string): Promise<void> {
    await apiClient.delete(`/courses/${courseId}/assign/${batchId}`);
  },
};
