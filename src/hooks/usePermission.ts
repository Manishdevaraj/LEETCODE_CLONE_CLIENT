import { useAuth } from '@/contexts/AuthContext';

export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return user?.permissions?.includes(permission) ?? false;
}

export function usePermissions(...permissions: string[]): boolean {
  const { user } = useAuth();
  return permissions.every(p => user?.permissions?.includes(p) ?? false);
}

export function usePageAccess(page: string): boolean {
  const { user } = useAuth();
  return user?.pageAccess?.includes(page) ?? false;
}

export function useRole(): string | null {
  const { user } = useAuth();
  return user?.role?.name ?? null;
}
