import apiClient from '@/lib/axios';
import type {
  McqCategory,
  McqCategoryCreatePayload,
  McqCategoryUpdatePayload,
  McqQuestion,
  McqQuestionCreatePayload,
  McqQuestionUpdatePayload,
  McqQuestionListParams,
} from '@/types/mcq.types';

export const mcqService = {
  // ── Category CRUD ──────────────────────────────────────────────

  async getCategories(): Promise<McqCategory[]> {
    const { data } = await apiClient.get<McqCategory[]>('/mcq-categories');
    return data;
  },

  async createCategory(payload: McqCategoryCreatePayload): Promise<McqCategory> {
    const { data } = await apiClient.post<McqCategory>('/mcq-categories', payload);
    return data;
  },

  async updateCategory(id: string, payload: McqCategoryUpdatePayload): Promise<McqCategory> {
    const { data } = await apiClient.patch<McqCategory>(`/mcq-categories/${id}`, payload);
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/mcq-categories/${id}`);
  },

  // ── Question CRUD ──────────────────────────────────────────────

  async getQuestions(params?: McqQuestionListParams): Promise<McqQuestion[]> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params?.topic) searchParams.set('topic', params.topic);
    const query = searchParams.toString();
    const { data } = await apiClient.get<{ data: McqQuestion[] }>(`/mcq-questions${query ? `?${query}` : ''}`);
    return data.data;
  },

  async getQuestionCount(params?: McqQuestionListParams): Promise<number> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params?.topic) searchParams.set('topic', params.topic);
    const query = searchParams.toString();
    const { data } = await apiClient.get<number | { count: number }>(
      `/mcq-questions/count${query ? `?${query}` : ''}`,
    );
    return typeof data === 'number' ? data : (data as { count: number }).count ?? 0;
  },

  async createQuestion(payload: McqQuestionCreatePayload): Promise<McqQuestion> {
    const { data } = await apiClient.post<McqQuestion>('/mcq-questions', payload);
    return data;
  },

  async updateQuestion(id: string, payload: McqQuestionUpdatePayload): Promise<McqQuestion> {
    const { data } = await apiClient.patch<McqQuestion>(`/mcq-questions/${id}`, payload);
    return data;
  },

  async deleteQuestion(id: string): Promise<void> {
    await apiClient.delete(`/mcq-questions/${id}`);
  },
};
