// Extracted from: src/pages/admin/RoleManagementPage.tsx

export interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface PageAccess {
  id: string;
  code: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions?: Permission[];
  pageAccess?: PageAccess[];
}

/** Role with permissions and pageAccess always populated. */
export interface RoleDetail extends Role {
  permissions: Permission[];
  pageAccess: PageAccess[];
}

// ---------------------------------------------------------------------------
// Payload types (used by role.service)
// ---------------------------------------------------------------------------

export interface RoleCreatePayload {
  name: string;
  description?: string;
  permissions?: string[];
  pageAccess?: string[];
}

export type RoleUpdatePayload = Partial<RoleCreatePayload>;
