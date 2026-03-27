import apiClient from '@/lib/axios';
import type {
  Role,
  RoleDetail,
  RoleCreatePayload,
  RoleUpdatePayload,
  Permission,
  PageAccess,
} from '@/types/role.types';

export const roleService = {
  // ── Role CRUD ──────────────────────────────────────────────────

  async getAll(): Promise<Role[]> {
    const { data } = await apiClient.get<Role[]>('/roles');
    return data;
  },

  async getById(id: string): Promise<RoleDetail> {
    const { data } = await apiClient.get(`/roles/${id}`);
    return {
      ...data,
      permissions: (data.rolePermissions ?? []).map((rp: { permission: Permission }) => rp.permission),
      pageAccess: (data.rolePageAccess ?? []).map((rp: { pageAccess: PageAccess }) => rp.pageAccess),
    } as RoleDetail;
  },

  async create(payload: RoleCreatePayload): Promise<Role> {
    const { data } = await apiClient.post<Role>('/roles', payload);
    return data;
  },

  async update(id: string, payload: RoleUpdatePayload): Promise<Role> {
    const { data } = await apiClient.patch<Role>(`/roles/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },

  // ── Permissions & Page Access ──────────────────────────────────

  async getAllPermissions(): Promise<Permission[]> {
    const { data } = await apiClient.get<Record<string, Permission[]>>('/roles/permissions');
    return Object.values(data).flat();
  },

  async getAllPageAccess(): Promise<PageAccess[]> {
    const { data } = await apiClient.get<PageAccess[]>('/roles/page-access');
    return data;
  },

  async updatePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await apiClient.put(`/roles/${roleId}/permissions`, { permissionIds });
  },

  async updatePageAccess(roleId: string, pageAccessIds: string[]): Promise<void> {
    await apiClient.put(`/roles/${roleId}/page-access`, { pageAccessIds });
  },
};
