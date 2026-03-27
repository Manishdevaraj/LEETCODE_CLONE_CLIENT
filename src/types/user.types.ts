// Extracted from: src/pages/admin/UserManagementPage.tsx,
//                 src/pages/admin/StaffManagementPage.tsx,
//                 src/pages/admin/StudentManagementPage.tsx

export interface User {
  id: string;
  name: string;
  email: string;
  department: string | null;
  createdAt: string;
  role: { id: string; name: string };
  college: { id: string; name: string } | null;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Student-specific (StudentManagementPage)
// ---------------------------------------------------------------------------

export interface StudentBatchInfo {
  id: string;
  name: string;
  year: number;
  department: { id: string; name: string };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  department: string | null;
  createdAt: string;
  role: { id: string; name: string };
  college: { id: string; name: string } | null;
  batchStudents: { batch: StudentBatchInfo }[];
}

export interface StudentsResponse {
  data: Student[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Param / payload types (used by user.service)
// ---------------------------------------------------------------------------

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  collegeId?: string;
  batchId?: string;
  userType?: string;
}

export interface UserCreatePayload {
  email: string;
  name: string;
  password: string;
  roleId: string;
  collegeId?: string;
  department?: string;
}

export interface ChangeRolePayload {
  roleId: string;
}
