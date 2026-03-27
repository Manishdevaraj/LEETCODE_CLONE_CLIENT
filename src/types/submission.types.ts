// Extracted from: src/lib/editor.action.ts

export interface TestCaseResult {
  testCaseId: string;
  status: string;
  timeUsed: number;
  isHidden: boolean;
  actualOutput: string;
}

export interface RunResult {
  status: string;
  score: number;
  total: number;
  passed: number;
  failed: number;
  timeUsed: number;
  results: TestCaseResult[];
  errorMessage?: string;
  runtimeError?: string;
}

export interface SubmissionSummary {
  id: string;
  language: string;
  status: string;
  score: number;
  timeUsed: number | null;
  createdAt: string;
}

export interface SubmissionTestResult {
  testCaseId: string;
  status: string;
  isHidden: boolean;
  timeUsed: number;
}

export interface SubmissionResult {
  id: string;
  language: string;
  code: string;
  status: string;
  score: number;
  timeUsed: number;
  memoryUsed: number | null;
  results: SubmissionTestResult[];
  errorMessage?: string;
  createdAt: string;
  userId: string;
  questionId: string;
}
