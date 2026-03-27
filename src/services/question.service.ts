import apiClient from '@/lib/axios';
import type {
  Question,
  QuestionSummary,
  QuestionCreatePayload,
  QuestionUpdatePayload,
  QuestionListParams,
} from '@/types/question.types';

export const questionService = {
  async getAll(params?: QuestionListParams): Promise<QuestionSummary[]> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
    const query = searchParams.toString();
    const { data } = await apiClient.get<QuestionSummary[]>(`/questions${query ? `?${query}` : ''}`);
    return data;
  },

  async getById(id: string): Promise<Question> {
    const { data } = await apiClient.get<Question>(`/questions/${id}`);
    return data;
  },

  async getByIdAdmin(id: string): Promise<Question> {
    const { data } = await apiClient.get<Question>(`/questions/${id}/admin`);
    return data;
  },

  async create(payload: QuestionCreatePayload): Promise<Question> {
    const { data } = await apiClient.post<Question>('/questions', payload);
    return data;
  },

  async update(id: string, payload: QuestionUpdatePayload): Promise<Question> {
    const { data } = await apiClient.patch<Question>(`/questions/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/questions/${id}`);
  },
};
