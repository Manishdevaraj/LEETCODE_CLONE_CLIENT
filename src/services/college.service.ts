import apiClient from '@/lib/axios';
import type {
  College,
  CollegeCreatePayload,
  CollegeUpdatePayload,
  Department,
  DepartmentCreatePayload,
  DepartmentUpdatePayload,
} from '@/types/college.types';

export const collegeService = {
  // ── College CRUD ───────────────────────────────────────────────

  async getAll(): Promise<College[]> {
    const { data } = await apiClient.get<College[]>('/colleges');
    return data;
  },

  async create(payload: CollegeCreatePayload): Promise<College> {
    const { data } = await apiClient.post<College>('/colleges', payload);
    return data;
  },

  async update(id: string, payload: CollegeUpdatePayload): Promise<College> {
    const { data } = await apiClient.patch<College>(`/colleges/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/colleges/${id}`);
  },

  // ── Department CRUD ────────────────────────────────────────────

  async getDepartments(collegeId: string): Promise<Department[]> {
    const { data } = await apiClient.get<Department[]>(`/colleges/${collegeId}/departments`);
    return data;
  },

  async createDepartment(collegeId: string, payload: DepartmentCreatePayload): Promise<Department> {
    const { data } = await apiClient.post<Department>(
      `/colleges/${collegeId}/departments`,
      payload,
    );
    return data;
  },

  async updateDepartment(departmentId: string, payload: DepartmentUpdatePayload): Promise<Department> {
    const { data } = await apiClient.patch<Department>(`/departments/${departmentId}`, payload);
    return data;
  },

  async deleteDepartment(departmentId: string): Promise<void> {
    await apiClient.delete(`/departments/${departmentId}`);
  },
};
