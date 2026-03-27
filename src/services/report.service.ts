import apiClient from '@/lib/axios';
import type {
  TestReport,
  TestParticipationReport,
  BatchReport,
  CollegeComparisonReport,
  StudentReport,
  CourseProgressReport,
  TrendsReport,
} from '@/types/report.types';

export const reportService = {
  async getTestReport(testId: string): Promise<TestReport> {
    const { data } = await apiClient.get<TestReport>(`/reports/test/${testId}?format=json`);
    return data;
  },

  async getTestParticipation(testId: string): Promise<TestParticipationReport> {
    const { data } = await apiClient.get<TestParticipationReport>(
      `/reports/test/${testId}/participation?format=json`,
    );
    return data;
  },

  async getBatchReport(batchId: string): Promise<BatchReport> {
    const { data } = await apiClient.get<BatchReport>(`/reports/batch/${batchId}?format=json`);
    return data;
  },

  async getCollegeComparison(): Promise<CollegeComparisonReport> {
    const { data } = await apiClient.get<CollegeComparisonReport>(
      '/reports/college-comparison?format=json',
    );
    return data;
  },

  async getStudentReport(studentId: string): Promise<StudentReport> {
    const { data } = await apiClient.get<StudentReport>(
      `/reports/student/${studentId}?format=json`,
    );
    return data;
  },

  async getCourseProgressReport(courseId: string): Promise<CourseProgressReport> {
    const { data } = await apiClient.get<CourseProgressReport>(
      `/reports/course/${courseId}/progress?format=json`,
    );
    return data;
  },

  async getTrends(period: string): Promise<TrendsReport> {
    const { data } = await apiClient.get<TrendsReport>(
      `/reports/trends?period=${period}&format=json`,
    );
    return data;
  },

  /** Download report as Excel blob */
  async downloadExcel(url: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' });
    return data;
  },
};
