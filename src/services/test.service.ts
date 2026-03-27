import apiClient from '@/lib/axios';
import type {
  Test,
  TestDetail,
  TestCreatePayload,
  TestUpdatePayload,
  TestQuestion,
  TestQuestionPayload,
  TestBatchAssignPayload,
  AutoGenRule,
} from '@/types/test.types';

export const testService = {
  // ── Test CRUD ──────────────────────────────────────────────────

  async getAll(): Promise<Test[]> {
    const { data } = await apiClient.get<Test[]>('/tests');
    return data;
  },

  async getById(id: string): Promise<TestDetail> {
    const { data } = await apiClient.get<TestDetail>(`/tests/${id}`);
    return data;
  },

  async create(payload: TestCreatePayload): Promise<Test> {
    const { data } = await apiClient.post<Test>('/tests', payload);
    return data;
  },

  async update(id: string, payload: TestUpdatePayload): Promise<Test> {
    const { data } = await apiClient.patch<Test>(`/tests/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tests/${id}`);
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await apiClient.patch(`/tests/${id}/status`, { status });
  },

  // ── Questions ──────────────────────────────────────────────────

  async addQuestion(testId: string, payload: TestQuestionPayload): Promise<TestQuestion> {
    const { data } = await apiClient.post<TestQuestion>(`/tests/${testId}/questions`, payload);
    return data;
  },

  async removeQuestion(testId: string, testQuestionId: string): Promise<void> {
    await apiClient.delete(`/tests/${testId}/questions/${testQuestionId}`);
  },

  async autoGenerate(testId: string, rules: AutoGenRule[]): Promise<void> {
    await apiClient.post(`/tests/${testId}/auto-generate`, { rules });
  },

  async regenerateQuestion(testId: string, testQuestionId: string): Promise<TestQuestion> {
    const { data } = await apiClient.post<TestQuestion>(
      `/tests/${testId}/regenerate-question/${testQuestionId}`,
    );
    return data;
  },

  // ── Batch assignment ───────────────────────────────────────────

  async assignBatches(testId: string, payload: TestBatchAssignPayload): Promise<void> {
    await apiClient.post(`/tests/${testId}/assign`, payload);
  },

  async unassignBatch(testId: string, batchId: string): Promise<void> {
    await apiClient.delete(`/tests/${testId}/batches/${batchId}`);
  },

  // ── Student-facing ─────────────────────────────────────────────

  async getMyTests(): Promise<Test[]> {
    const { data } = await apiClient.get<Test[]>('/tests/my-tests');
    return data;
  },

  async joinByToken(secureToken: string): Promise<{ test: TestDetail }> {
    const { data } = await apiClient.get<{ test: TestDetail }>(`/tests/join/${secureToken}`);
    return data;
  },
};
