// @ts-nocheck
import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, authFetch } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface McqOption {
  id: string;
  text: string;
  order: number;
}

interface McqQuestion {
  id: string;
  questionText: string;
  options: McqOption[];
  isMultiCorrect: boolean;
  marks: number;
  order: number;
}

interface CodingQuestion {
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
  mcqQuestion?: McqQuestion;
  codingQuestion?: CodingQuestion;
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

interface TestSessionContextType {
  session: TestSession | null;
  isLoading: boolean;
  error: string | null;
  initSession: (testId: string) => Promise<void>;
  setCurrentQuestion: (index: number) => void;
  saveMcqAnswer: (mcqQuestionId: string, selectedOptions: string[]) => void;
  submitCode: (questionId: string, language: string, code: string) => Promise<any>;
  finishTest: () => Promise<void>;
}

const TestSessionContext = createContext<TestSessionContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function TestSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const mcqDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.isFinished) return;

    timerRef.current = setInterval(() => {
      setSession(prev => {
        if (!prev || prev.isFinished) return prev;
        const next = prev.timeRemaining - 1;
        if (next <= 0) {
          // Auto-submit when time runs out
          handleFinish(prev.testId);
          return { ...prev, timeRemaining: 0, isFinished: true };
        }
        return { ...prev, timeRemaining: next };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.testId, session?.isFinished]);

  // ── Initialize session ───────────────────────────────────────────────────
  const initSession = useCallback(async (testId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/test-attempts/${testId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load test session');
      }
      const data = await res.json();

      const attempt = data.attempt || data;

      // Block access if test is no longer in progress
      if (['SUBMITTED', 'AUTO_SUBMITTED', 'TIMED_OUT'].includes(attempt.status)) {
        throw new Error('This test has already been completed');
      }

      const test = attempt.test || data.test;
      const rawQuestions = attempt.test?.testQuestions || attempt.questions || data.questions || [];
      const questions: TestQuestionItem[] = rawQuestions.map((q: any) => ({
        type: q.type || (q.mcqQuestion ? 'MCQ' : 'CODING'),
        mcqQuestion: q.mcqQuestion,
        codingQuestion: q.codingQuestion || q.question,
        order: q.order ?? 0,
        marks: q.marks ?? (q.mcqQuestion?.marks || q.codingQuestion?.marks || 0),
      }));

      // Sort by order
      questions.sort((a, b) => a.order - b.order);

      // Restore existing MCQ answers from attempt
      const mcqAnswers: Record<string, string[]> = {};
      if (attempt.mcqAnswers) {
        for (const ans of attempt.mcqAnswers) {
          mcqAnswers[ans.mcqQuestionId] = ans.selectedOptions || [];
        }
      }

      // Restore existing code submissions
      const codeSubmissions: Record<string, { language: string; status: string }> = {};
      if (attempt.codeSubmissions) {
        for (const sub of attempt.codeSubmissions) {
          codeSubmissions[sub.questionId] = { language: sub.language, status: sub.status };
        }
      }

      // Calculate remaining time
      const startedAt = new Date(attempt.startedAt).getTime();
      const durationMs = (test.durationMins || 60) * 60 * 1000;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

      setSession({
        testId,
        attemptId: attempt.id,
        test: {
          id: test.id,
          title: test.title,
          description: test.description || '',
          durationMins: test.durationMins,
          type: test.testType || test.type,
          isProctored: test.isProctored || false,
          totalMarks: test.totalMarks || 0,
          maxViolations: test.maxViolations ?? 3,
        },
        questions,
        currentQuestionIndex: 0,
        mcqAnswers,
        codeSubmissions,
        timeRemaining: remaining,
        isSubmitting: false,
        isFinished: remaining <= 0 || attempt.status === 'COMPLETED',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Set current question ─────────────────────────────────────────────────
  const setCurrentQuestion = useCallback((index: number) => {
    setSession(prev => prev ? { ...prev, currentQuestionIndex: index } : prev);
  }, []);

  // ── Save MCQ answer (with debounced server sync) ─────────────────────────
  const saveMcqAnswer = useCallback((mcqQuestionId: string, selectedOptions: string[]) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        mcqAnswers: { ...prev.mcqAnswers, [mcqQuestionId]: selectedOptions },
      };
    });

    // Debounce server save
    if (mcqDebounceRef.current[mcqQuestionId]) {
      clearTimeout(mcqDebounceRef.current[mcqQuestionId]);
    }
    mcqDebounceRef.current[mcqQuestionId] = setTimeout(() => {
      setSession(prev => {
        if (!prev) return prev;
        authFetch(`${API_BASE}/test-attempts/${prev.testId}/answer-mcq`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mcqQuestionId, selectedOptions }),
        }).catch(console.error);
        return prev;
      });
    }, 500);
  }, []);

  // ── Submit code ──────────────────────────────────────────────────────────
  const submitCode = useCallback(async (questionId: string, language: string, code: string) => {
    if (!session) return;
    const res = await authFetch(`${API_BASE}/test-attempts/${session.testId}/submit-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, language, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submission failed');

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        codeSubmissions: {
          ...prev.codeSubmissions,
          [questionId]: { language, status: data.status || 'SUBMITTED' },
        },
      };
    });
    return data;
  }, [session?.testId]);

  // ── Finish test ──────────────────────────────────────────────────────────
  const handleFinish = useCallback(async (testId: string) => {
    try {
      await authFetch(`${API_BASE}/test-attempts/${testId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Failed to finish test:', err);
    }
  }, []);

  const finishTest = useCallback(async () => {
    if (!session) return;
    setSession(prev => prev ? { ...prev, isSubmitting: true } : prev);
    try {
      await handleFinish(session.testId);
      setSession(prev => prev ? { ...prev, isFinished: true, isSubmitting: false } : prev);
      if (timerRef.current) clearInterval(timerRef.current);
      navigate(`/student/tests/${session.testId}/result`);
    } catch (err: any) {
      setSession(prev => prev ? { ...prev, isSubmitting: false } : prev);
      setError(err.message);
    }
  }, [session?.testId, navigate, handleFinish]);

  return (
    <TestSessionContext.Provider value={{
      session,
      isLoading,
      error,
      initSession,
      setCurrentQuestion,
      saveMcqAnswer,
      submitCode,
      finishTest,
    }}>
      {children}
    </TestSessionContext.Provider>
  );
}

export function useTestSession() {
  const ctx = useContext(TestSessionContext);
  if (!ctx) throw new Error('useTestSession must be used within TestSessionProvider');
  return ctx;
}
