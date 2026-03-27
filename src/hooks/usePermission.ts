import { useAuthStore } from '@/stores/authStore';

export function usePermission(permission: string): boolean {
  const { user } = useAuthStore();
  return user?.permissions?.includes(permission) ?? false;
}

export function usePermissions(...permissions: string[]): boolean {
  const { user } = useAuthStore();
  return permissions.every(p => user?.permissions?.includes(p) ?? false);
}

export function usePageAccess(page: string): boolean {
  const { user } = useAuthStore();
  return user?.pageAccess?.includes(page) ?? false;
}

export function useRole(): string | null {
  const { user } = useAuthStore();
  return user?.role?.name ?? null;
}
