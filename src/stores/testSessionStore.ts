import { create } from 'zustand';
import type { TestSession, TestQuestionItem, TestInfo } from '@/types/test-attempt.types';
import { testAttemptService } from '@/services/test-attempt.service';

interface TestSessionStore {
  session: TestSession | null;
  isLoading: boolean;
  error: string | null;
  _timerRef: ReturnType<typeof setInterval> | null;
  _mcqDebounceRefs: Record<string, ReturnType<typeof setTimeout>>;

  initSession: (testId: string) => Promise<void>;
  setCurrentQuestion: (index: number) => void;
  saveMcqAnswer: (mcqQuestionId: string, selectedOptions: string[]) => void;
  submitCode: (questionId: string, language: string, code: string) => Promise<unknown>;
  finishTest: () => Promise<void>;
  tick: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  clearSession: () => void;
}

export const useTestSessionStore = create<TestSessionStore>()((set, get) => ({
  session: null,
  isLoading: false,
  error: null,
  _timerRef: null,
  _mcqDebounceRefs: {},

  initSession: async (testId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await testAttemptService.getAttempt(testId);
      const attempt = data.attempt || data;

      if (['SUBMITTED', 'AUTO_SUBMITTED', 'TIMED_OUT'].includes(attempt.status)) {
        throw new Error('This test has already been completed');
      }

      const test = attempt.test || data.test;
      const rawQuestions = attempt.test?.testQuestions || attempt.questions || data.questions || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const questions: TestQuestionItem[] = rawQuestions.map((q: any) => ({
        type: q.type || (q.mcqQuestion ? 'MCQ' : 'CODING'),
        mcqQuestion: q.mcqQuestion,
        codingQuestion: q.codingQuestion || q.question,
        order: q.order ?? 0,
        marks: q.marks ?? (q.mcqQuestion?.marks || q.codingQuestion?.marks || 0),
      }));
      questions.sort((a, b) => a.order - b.order);

      const mcqAnswers: Record<string, string[]> = {};
      if (attempt.mcqAnswers) {
        for (const ans of attempt.mcqAnswers) {
          mcqAnswers[ans.mcqQuestionId] = ans.selectedOptions || [];
        }
      }

      const codeSubmissions: Record<string, { language: string; status: string }> = {};
      if (attempt.codeSubmissions) {
        for (const sub of attempt.codeSubmissions) {
          codeSubmissions[sub.questionId] = { language: sub.language, status: sub.status };
        }
      }

      const startedAt = new Date(attempt.startedAt).getTime();
      const durationMs = (test.durationMins || 60) * 60 * 1000;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

      const testInfo: TestInfo = {
        id: test.id,
        title: test.title,
        description: test.description || '',
        durationMins: test.durationMins,
        type: test.testType || test.type,
        isProctored: test.isProctored || false,
        totalMarks: test.totalMarks || 0,
        maxViolations: test.maxViolations ?? 3,
      };

      set({
        session: {
          testId,
          attemptId: attempt.id,
          test: testInfo,
          questions,
          currentQuestionIndex: 0,
          mcqAnswers,
          codeSubmissions,
          timeRemaining: remaining,
          isSubmitting: false,
          isFinished: remaining <= 0 || attempt.status === 'COMPLETED',
        },
        isLoading: false,
      });

      get().startTimer();
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setCurrentQuestion: (index: number) => {
    set((state) => {
      if (!state.session) return state;
      return { session: { ...state.session, currentQuestionIndex: index } };
    });
  },

  saveMcqAnswer: (mcqQuestionId: string, selectedOptions: string[]) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          mcqAnswers: { ...state.session.mcqAnswers, [mcqQuestionId]: selectedOptions },
        },
      };
    });

    const refs = get()._mcqDebounceRefs;
    if (refs[mcqQuestionId]) clearTimeout(refs[mcqQuestionId]);

    refs[mcqQuestionId] = setTimeout(() => {
      const session = get().session;
      if (!session) return;
      testAttemptService
        .answerMcq(session.testId, { mcqQuestionId, selectedOptions })
        .catch(console.error);
    }, 500);
  },

  submitCode: async (questionId: string, language: string, code: string) => {
    const session = get().session;
    if (!session) return;

    const data = await testAttemptService.submitCode(session.testId, {
      questionId,
      language,
      code,
    });

    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          codeSubmissions: {
            ...state.session.codeSubmissions,
            [questionId]: { language, status: data.status || 'SUBMITTED' },
          },
        },
      };
    });

    return data;
  },

  finishTest: async () => {
    const session = get().session;
    if (!session) return;

    set((state) => ({
      session: state.session ? { ...state.session, isSubmitting: true } : null,
    }));

    try {
      await testAttemptService.finishTest(session.testId);
      get().stopTimer();
      set((state) => ({
        session: state.session
          ? { ...state.session, isFinished: true, isSubmitting: false }
          : null,
      }));
    } catch (err: unknown) {
      set((state) => ({
        session: state.session ? { ...state.session, isSubmitting: false } : null,
        error: (err as Error).message,
      }));
    }
  },

  tick: () => {
    set((state) => {
      if (!state.session || state.session.isFinished) return state;
      const next = state.session.timeRemaining - 1;
      if (next <= 0) {
        // Auto-submit
        testAttemptService.finishTest(state.session.testId).catch(console.error);
        get().stopTimer();
        return {
          session: { ...state.session, timeRemaining: 0, isFinished: true },
        };
      }
      return { session: { ...state.session, timeRemaining: next } };
    });
  },

  startTimer: () => {
    get().stopTimer();
    const ref = setInterval(() => get().tick(), 1000);
    set({ _timerRef: ref });
  },

  stopTimer: () => {
    const ref = get()._timerRef;
    if (ref) clearInterval(ref);
    set({ _timerRef: null });
  },

  clearSession: () => {
    get().stopTimer();
    set({ session: null, error: null });
  },
}));
