// Extracted from: src/pages/admin/BatchManagementPage.tsx

export interface Batch {
  id: string;
  name: string;
  year: number | null;
  semester: number | null;
  departmentId: string;
  _count?: { batchStudents: number; batchTeachers: number };
}

export interface BatchUser {
  id: string;
  name: string | null;
  email: string;
}

export interface BatchDetail extends Batch {
  batchStudents: { user: BatchUser }[];
  batchTeachers: { user: BatchUser }[];
}

// ---------------------------------------------------------------------------
// Payload types (used by batch.service)
// ---------------------------------------------------------------------------

export interface BatchCreatePayload {
  name: string;
  year?: number;
  semester?: number;
}

export interface BatchUpdatePayload {
  name?: string;
  year?: number;
  semester?: number;
}

export interface BatchAddMembersPayload {
  emails: string[];
}
