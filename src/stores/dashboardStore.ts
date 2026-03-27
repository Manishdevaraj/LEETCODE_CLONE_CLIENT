import { create } from 'zustand';
import type { DashboardData } from '@/types/dashboard.types';
import { dashboardService } from '@/services/dashboard.service';

interface DashboardStore {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardStore>()((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardService.getDashboard();
      set({ data, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
