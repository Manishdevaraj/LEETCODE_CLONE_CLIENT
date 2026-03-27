// Extracted from: src/lib/editor.action.ts, src/pages/admin/QuestionBankPage.tsx

export interface QuestionSummary {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  memoryLimit: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  createdAt: string;
}

export interface ApiTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  order: number;
}

export interface Question extends QuestionSummary {
  description: string;
  topic: string;
  testCases: ApiTestCase[];
}

/**
 * Admin-side question with additional optional fields visible in
 * QuestionBankPage (constraints, formats, hidden test cases, etc.).
 */
export interface AdminQuestion {
  id: string;
  title: string;
  description?: string;
  topic: string;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  memoryLimit: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  createdAt: string;
  _count?: { testCases: number };
  testCases?: AdminTestCase[];
}

/** Test case as used in the admin QuestionBankPage editor. */
export interface AdminTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
}

// ---------------------------------------------------------------------------
// Payload / param types (used by question.service)
// ---------------------------------------------------------------------------

export interface QuestionListParams {
  page?: number;
  limit?: number;
  difficulty?: string;
}

export interface QuestionCreatePayload {
  title: string;
  description: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  memoryLimit: number;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    order: number;
  }[];
}

export type QuestionUpdatePayload = Partial<QuestionCreatePayload>;
