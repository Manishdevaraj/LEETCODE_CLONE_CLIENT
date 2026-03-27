import apiClient from '@/lib/axios';
import type {
  TestCategory,
  TestCategoryCreatePayload,
  TestCategoryUpdatePayload,
} from '@/types/test-category.types';

export const testCategoryService = {
  async getAll(): Promise<TestCategory[]> {
    const { data } = await apiClient.get<TestCategory[]>('/test-categories');
    return data;
  },

  async create(payload: TestCategoryCreatePayload): Promise<TestCategory> {
    const { data } = await apiClient.post<TestCategory>('/test-categories', payload);
    return data;
  },

  async update(id: string, payload: TestCategoryUpdatePayload): Promise<TestCategory> {
    const { data } = await apiClient.patch<TestCategory>(`/test-categories/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/test-categories/${id}`);
  },
};
