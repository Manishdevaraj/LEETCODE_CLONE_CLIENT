import apiClient from '@/lib/axios';
import type { SubmissionSummary } from '@/types/submission.types';

export const submissionService = {
  async getByQuestion(questionId: string): Promise<SubmissionSummary[]> {
    const { data } = await apiClient.get<SubmissionSummary[]>(`/submissions?questionId=${questionId}`);
    return data;
  },
};
