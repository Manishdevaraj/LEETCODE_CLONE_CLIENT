import apiClient from '@/lib/axios';
import type { DashboardData } from '@/types/dashboard.types';

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await apiClient.get<DashboardData>('/admin/dashboard');
    return data;
  },
};
