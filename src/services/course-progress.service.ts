import apiClient from '@/lib/axios';
import type {
  CourseProgressSummary,
  CourseProgressDetail,
  CourseDay,
  CourseSubModule,
  SubmitPracticeMcqPayload,
  PracticeMcqResult,
} from '@/types/course.types';

export const courseProgressService = {
  async getMyCourses(): Promise<CourseProgressSummary[]> {
    const { data } = await apiClient.get<CourseProgressSummary[]>('/course-progress/my-courses');
    return data;
  },

  async getCourseProgress(courseId: string): Promise<CourseProgressDetail> {
    const { data } = await apiClient.get<CourseProgressDetail>(`/course-progress/${courseId}`);
    return data;
  },

  async getDayContent(courseId: string, dayNum: number): Promise<CourseDay> {
    const { data } = await apiClient.get<CourseDay>(`/course-progress/${courseId}/day/${dayNum}`);
    return data;
  },

  async completeDay(courseId: string): Promise<void> {
    await apiClient.post(`/course-progress/${courseId}/complete-day`);
  },

  async completeContent(courseId: string, contentId: string): Promise<void> {
    await apiClient.post(`/course-progress/${courseId}/complete-content/${contentId}`);
  },

  async completePracticeQuestion(courseId: string, practiceQuestionId: string): Promise<void> {
    await apiClient.post(`/course-progress/${courseId}/complete-practice/${practiceQuestionId}`);
  },

  async getPracticeSubModule(
    courseId: string,
    dayNum: number,
    subModuleId: string,
  ): Promise<CourseSubModule> {
    const { data } = await apiClient.get<CourseSubModule>(
      `/course-progress/${courseId}/day/${dayNum}/practice/${subModuleId}`,
    );
    return data;
  },

  async submitPracticeMcqAnswer(
    courseId: string,
    payload: SubmitPracticeMcqPayload,
  ): Promise<PracticeMcqResult> {
    const { data } = await apiClient.post<PracticeMcqResult>(
      `/course-progress/${courseId}/submit-mcq-answer`,
      payload,
    );
    return data;
  },
};
