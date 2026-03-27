import apiClient from '@/lib/axios';
import type {
  User,
  UsersResponse,
  UserListParams,
  UserCreatePayload,
  ChangeRolePayload,
} from '@/types/user.types';

export const userService = {
  async getAll(params: UserListParams): Promise<UsersResponse> {
    const searchParams = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    if (params.search) searchParams.set('search', params.search);
    if (params.roleId) searchParams.set('roleId', params.roleId);
    if (params.collegeId) searchParams.set('collegeId', params.collegeId);
    if (params.batchId) searchParams.set('batchId', params.batchId);
    if (params.userType) searchParams.set('userType', params.userType);

    const { data } = await apiClient.get<UsersResponse>(`/admin/users?${searchParams}`);
    return data;
  },

  async create(payload: UserCreatePayload): Promise<User> {
    const { data } = await apiClient.post<User>('/admin/users', payload);
    return data;
  },

  async changeRole(userId: string, payload: ChangeRolePayload): Promise<void> {
    await apiClient.patch(`/admin/users/${userId}/role`, payload);
  },

  async delete(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  async searchUsers(query: string): Promise<User[]> {
    const { data } = await apiClient.get<User[]>(`/admin/users?search=${encodeURIComponent(query)}`);
    return data;
  },
};
