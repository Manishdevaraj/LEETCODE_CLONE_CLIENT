// Extracted from: src/contexts/TestSessionContext.tsx,
//                 src/pages/student/TestLobbyPage.tsx,
//                 src/pages/student/TestExamPage.tsx,
//                 src/pages/student/TestResultPage.tsx

// ---------------------------------------------------------------------------
// Test session context types (TestSessionContext.tsx)
// ---------------------------------------------------------------------------

export interface TestSessionMcqOption {
  id: string;
  text: string;
  order: number;
}

export interface TestSessionMcqQuestion {
  id: string;
  questionText: string;
  options: TestSessionMcqOption[];
  isMultiCorrect: boolean;
  marks: number;
  order: number;
}

export interface TestSessionCodingQuestion {
  id: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  marks: number;
  order: number;
  testCases: { id: string; input: string; expectedOutput: string }[];
}

export interface TestQuestionItem {
  type: 'MCQ' | 'CODING';
  mcqQuestion?: TestSessionMcqQuestion;
  codingQuestion?: TestSessionCodingQuestion;
  order: number;
  marks: number;
}

export interface TestInfo {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  type: string;
  isProctored: boolean;
  totalMarks: number;
  maxViolations: number;
}

export interface TestSession {
  testId: string;
  attemptId: string;
  test: TestInfo;
  questions: TestQuestionItem[];
  currentQuestionIndex: number;
  mcqAnswers: Record<string, string[]>;
  codeSubmissions: Record<string, { language: string; status: string }>;
  timeRemaining: number;
  isSubmitting: boolean;
  isFinished: boolean;
}

// ---------------------------------------------------------------------------
// Test lobby types (TestLobbyPage.tsx)
// ---------------------------------------------------------------------------

export interface QuestionBreakdown {
  mcq: { count: number; marks: number };
  coding: { count: number; marks: number };
}

export interface TestPreview {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  type: string;
  isProctored: boolean;
  maxViolations?: number;
  totalMarks: number;
  totalQuestions: number;
  requiresAccessCode: boolean;
  startTime: string | null;
  endTime: string | null;
  status: string;
  breakdown?: QuestionBreakdown;
}

// ---------------------------------------------------------------------------
// Test result types (TestResultPage.tsx)
// ---------------------------------------------------------------------------

export interface McqAnswerResult {
  mcqQuestionId: string;
  questionText: string;
  selectedOptions: string[];
  correctOptions: string[];
  options: { id: string; text: string }[];
  isCorrect: boolean;
  marks: number;
  marksObtained: number;
}

export interface CodeSubmissionResult {
  questionId: string;
  questionTitle: string;
  language: string;
  status: string;
  marks: number;
  marksObtained: number;
}

export interface TestAttemptResult {
  id: string;
  testId: string;
  status: string;
  score: number;
  totalMarks: number;
  startedAt: string;
  finishedAt: string | null;
  test: {
    title: string;
    type: string;
    durationMins: number;
  };
  mcqResults: McqAnswerResult[];
  codeResults: CodeSubmissionResult[];
}

// ---------------------------------------------------------------------------
// Service payload / response types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TestAttemptResponse = any; // raw API shape, parsed in store

export interface AnswerMcqPayload {
  mcqQuestionId: string;
  selectedOptions: string[];
}

export interface SubmitCodePayload {
  questionId: string;
  language: string;
  code: string;
}

export interface SubmitCodeResponse {
  status: string;
  [key: string]: unknown;
}

export interface VerifyAndStartPayload {
  accessCode?: string;
  password?: string;
}

export interface VerifyAndStartResponse {
  attemptId: string;
}
