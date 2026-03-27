// Extracted from: src/pages/admin/TestManagementPage.tsx, src/pages/student/StudentTestsPage.tsx

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type TestType = 'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED';

export type AdminTestStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/** Student-facing tests never show DRAFT. */
export type StudentTestStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// ---------------------------------------------------------------------------
// Admin-side (TestManagementPage)
// ---------------------------------------------------------------------------

export interface TestCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  _count?: { tests: number };
}

export interface Test {
  id: string;
  title: string;
  description: string | null;
  testType: TestType;
  durationMins: number;
  status: AdminTestStatus;
  startTime: string | null;
  endTime: string | null;
  isProctored: boolean;
  maxViolations?: number;
  accessCode: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string; color: string | null } | null;
  _count?: { testQuestions: number };
  testQuestions?: TestQuestion[];
  batchAssignments?: TestBatch[];
}

export interface TestQuestion {
  id: string;
  testId: string;
  mcqQuestionId: string | null;
  questionId: string | null;
  marks: number;
  order: number;
  mcqQuestion?: { id: string; questionText: string; difficulty: string };
  question?: { id: string; title: string; difficulty: string };
}

export interface TestBatch {
  id: string;
  testId: string;
  batchId: string;
  secureUrl: string | null;
  batch?: {
    id: string;
    name: string;
    department?: {
      id: string;
      name: string;
      college?: { id: string; name: string };
    };
  };
}

/** Used in TestManagementPage auto-generate dialog. */
export interface AutoGenRule {
  questionType: 'MCQ' | 'CODING';
  count: number;
  difficulty: string;
  topic: string;
  categoryId: string;
}

// ---------------------------------------------------------------------------
// Student-side (StudentTestsPage)
// ---------------------------------------------------------------------------

export interface StudentTestCategory {
  id: string;
  name: string;
  color: string | null;
}

export interface TestAttempt {
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'TIMED_OUT';
  score: number | null;
  totalMarks: number | null;
  submittedAt: string | null;
}

export interface StudentTest {
  id: string;
  title: string;
  description: string | null;
  durationMins: number;
  testType: TestType;
  status: StudentTestStatus;
  startTime: string | null;
  endTime: string | null;
  totalMarks: number;
  secureToken: string;
  isProctored: boolean;
  category: StudentTestCategory | null;
  _count: { testQuestions: number };
  myAttempt: TestAttempt | null;
}

// ---------------------------------------------------------------------------
// Test-management helper types (for question picker in admin)
// ---------------------------------------------------------------------------

export interface TestMgmtMcqQuestion {
  id: string;
  questionText: string;
  difficulty: string;
  topic: string | null;
  category?: { id: string; name: string };
}

export interface TestMgmtCodingQuestion {
  id: string;
  title: string;
  difficulty: string;
}

export interface TestMgmtMcqCategory {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Detail / payload types (used by test.service)
// ---------------------------------------------------------------------------

/** Test with fully populated relations (questions, batch assignments). */
export interface TestDetail extends Test {
  testQuestions: TestQuestion[];
  batchAssignments: TestBatch[];
}

export interface TestCreatePayload {
  title: string;
  description?: string;
  testType: TestType;
  durationMins: number;
  startTime?: string;
  endTime?: string;
  isProctored?: boolean;
  maxViolations?: number;
  accessCode?: string;
  categoryId?: string;
}

export type TestUpdatePayload = Partial<TestCreatePayload>;

export interface TestQuestionPayload {
  mcqQuestionId?: string;
  questionId?: string;
  marks: number;
  order: number;
}

export interface TestBatchAssignPayload {
  batchIds: string[];
}
