import apiClient from '@/lib/axios';
import type {
  Batch,
  BatchDetail,
  BatchCreatePayload,
  BatchUpdatePayload,
  BatchAddMembersPayload,
} from '@/types/batch.types';

export const batchService = {
  // ── CRUD ───────────────────────────────────────────────────────

  async getAll(): Promise<Batch[]> {
    const { data } = await apiClient.get<Batch[]>('/batches');
    return data;
  },

  async getByDepartment(departmentId: string): Promise<Batch[]> {
    const { data } = await apiClient.get<Batch[]>(`/departments/${departmentId}/batches`);
    return data;
  },

  async getById(id: string): Promise<BatchDetail> {
    const { data } = await apiClient.get<BatchDetail>(`/batches/${id}`);
    return data;
  },

  async create(departmentId: string, payload: BatchCreatePayload): Promise<Batch> {
    const { data } = await apiClient.post<Batch>(`/departments/${departmentId}/batches`, payload);
    return data;
  },

  async update(id: string, payload: BatchUpdatePayload): Promise<Batch> {
    const { data } = await apiClient.patch<Batch>(`/batches/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/batches/${id}`);
  },

  // ── Member management ──────────────────────────────────────────

  async addStudents(batchId: string, payload: BatchAddMembersPayload): Promise<void> {
    await apiClient.post(`/batches/${batchId}/students`, payload);
  },

  async removeStudent(batchId: string, userId: string): Promise<void> {
    await apiClient.delete(`/batches/${batchId}/students/${userId}`);
  },

  async addTeachers(batchId: string, payload: BatchAddMembersPayload): Promise<void> {
    await apiClient.post(`/batches/${batchId}/teachers`, payload);
  },

  async removeTeacher(batchId: string, userId: string): Promise<void> {
    await apiClient.delete(`/batches/${batchId}/teachers/${userId}`);
  },
};
