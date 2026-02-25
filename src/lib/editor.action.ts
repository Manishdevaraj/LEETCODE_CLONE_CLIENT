// @ts-nocheck
//@ts-ignore
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://edutech.raidotaxi.in';

// ─── Run result types ─────────────────────────────────────────────────────────

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

// ─── Question types ───────────────────────────────────────────────────────────

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

// ─── Submission history types ─────────────────────────────────────────────────

export interface SubmissionSummary {
  id: string;
  language: string;
  status: string;
  score: number;
  timeUsed: number | null;
  createdAt: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchQuestions(): Promise<QuestionSummary[]> {
  const res = await fetch(`${API_BASE}/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json() as Promise<QuestionSummary[]>;
}

export async function fetchQuestion(id: string): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch question');
  return res.json() as Promise<Question>;
}

export async function fetchSubmissions(questionId: string, userId: string): Promise<SubmissionSummary[]> {
  const res = await fetch(`${API_BASE}/submissions?questionId=${questionId}&userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json() as Promise<SubmissionSummary[]>;
}

// ─── Execution ────────────────────────────────────────────────────────────────

export const HARDCODED_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/** POST /compilerun → get jobId, then SSE stream until type=complete.
 *  Returns a cleanup function to close the EventSource early if needed. */
export function compileRun(
  language: string,
  code: string,
  questionId: string,
  onComplete: (result: RunResult) => void,
  onError: (err: string) => void,
): () => void {
  let es: EventSource | null = null;

  fetch(`${API_BASE}/compilerun`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, userId: HARDCODED_USER_ID, language, code }),
  })
    .then((r) => r.json())
    .then(({ jobId }: { jobId: string }) => {
      es = new EventSource(`${API_BASE}/compilerun/${jobId}/events`);

      es.onmessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data as string) as { type: string; result?: RunResult };

        // Only act on 'complete' — any other type (status, progress) = still running
        if (data.type === 'complete') {
          onComplete(data.result!);
          es?.close();
        }
      };

      es.onerror = () => {
        onError('Connection lost');
        es?.close();
      };
    })
    .catch((err: Error) => onError(err.message));

  return () => es?.close();
}

// ─── Submission types ─────────────────────────────────────────────────────────

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

/** POST /execute → get submissionId, then SSE /status/{submissionId} until type=complete. */
export function submitCode(
  language: string,
  code: string,
  questionId: string,
  onPending: (totalCount: number) => void,
  onComplete: (result: SubmissionResult) => void,
  onError: (err: string) => void,
): () => void {
  let es: EventSource | null = null;

  fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, userId: HARDCODED_USER_ID, language, code }),
  })
    .then((r) => r.json())
    .then(({ submissionId, totalCount }: { submissionId: string; totalCount: number }) => {
      onPending(totalCount);
      es = new EventSource(`${API_BASE}/status/${submissionId}`);

      es.onmessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data as string) as { type: string; submission?: SubmissionResult };
        if (data.type === 'complete') {
          onComplete(data.submission!);
          es?.close();
        }
      };

      es.onerror = () => {
        onError('Connection lost');
        es?.close();
      };
    })
    .catch((err: Error) => onError(err.message));

  return () => es?.close();
}
