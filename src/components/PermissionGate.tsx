import { useAuthStore } from '@/stores/authStore';
import { type ReactNode } from 'react';

interface PermissionGateProps {
  requires?: string[];      // permission codes - user needs ALL
  requiresAny?: string[];   // permission codes - user needs at least ONE
  pageAccess?: string;       // page access code
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ requires, requiresAny, pageAccess, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuthStore();
  if (!user) return fallback;

  if (requires && !requires.every(p => user.permissions.includes(p))) return fallback;
  if (requiresAny && !requiresAny.some(p => user.permissions.includes(p))) return fallback;
  if (pageAccess && !user.pageAccess.includes(pageAccess)) return fallback;

  return children;
}
