import apiClient from '@/lib/axios';
import type {
  TestAttemptResponse,
  AnswerMcqPayload,
  SubmitCodePayload,
  SubmitCodeResponse,
  VerifyAndStartPayload,
  VerifyAndStartResponse,
} from '@/types/test-attempt.types';

export const testAttemptService = {
  async getAttempt(testId: string): Promise<TestAttemptResponse> {
    const { data } = await apiClient.get<TestAttemptResponse>(`/test-attempts/${testId}`);
    return data;
  },

  async answerMcq(testId: string, payload: AnswerMcqPayload): Promise<void> {
    await apiClient.post(`/test-attempts/${testId}/answer-mcq`, payload);
  },

  async submitCode(testId: string, payload: SubmitCodePayload): Promise<SubmitCodeResponse> {
    const { data } = await apiClient.post<SubmitCodeResponse>(
      `/test-attempts/${testId}/submit-code`,
      payload,
    );
    return data;
  },

  async finishTest(testId: string): Promise<void> {
    await apiClient.post(`/test-attempts/${testId}/finish`);
  },

  async verifyAndStart(
    testId: string,
    payload: VerifyAndStartPayload,
  ): Promise<VerifyAndStartResponse> {
    const { data } = await apiClient.post<VerifyAndStartResponse>(
      `/test-attempts/${testId}/verify-and-start`,
      payload,
    );
    return data;
  },
};
