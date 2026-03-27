// Extracted from: src/pages/admin/CollegeManagementPage.tsx

export interface College {
  id: string;
  name: string;
  code: string;
  location: string | null;
  _count?: { departments: number };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  _count?: { batches: number };
}

// ---------------------------------------------------------------------------
// Payload types (used by college.service)
// ---------------------------------------------------------------------------

export interface CollegeCreatePayload {
  name: string;
  code?: string;
  location?: string;
}

export interface CollegeUpdatePayload {
  name?: string;
  code?: string;
  location?: string;
}

export interface DepartmentCreatePayload {
  name: string;
  code?: string;
}

export interface DepartmentUpdatePayload {
  name?: string;
  code?: string;
}
