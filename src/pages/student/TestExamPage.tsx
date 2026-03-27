import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTestSessionStore } from '@/stores/testSessionStore';
import type { TestQuestionItem } from '@/types/test-attempt.types';
import ProctorOverlay from '@/components/ProctorOverlay';
import { executionService } from '@/services/execution.service';
import type { RunResult, SubmissionResult } from '@/types/submission.types';

// ── Time formatter ───────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Main Exam Content ────────────────────────────────────────────────────────

function ExamContent() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const {
    session,
    isLoading,
    error,
    initSession,
    setCurrentQuestion,
    saveMcqAnswer,
    submitCode,
    finishTest,
  } = useTestSessionStore();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [codeValues, setCodeValues] = useState<Record<string, string>>({});
  const [codeLangs, setCodeLangs] = useState<Record<string, string>>({});
  const [codeSubmitStatus, setCodeSubmitStatus] = useState<Record<string, { loading: boolean; error?: string; success?: boolean }>>({});
  const [timesUpOverlay, setTimesUpOverlay] = useState(false);

  // ── Init session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (testId) initSession(testId);
  }, [testId]);

  // ── Watch for finished state (auto-submit) ──────────────────────────────
  useEffect(() => {
    if (session?.isFinished && session?.timeRemaining <= 0 && !timesUpOverlay) {
      setTimesUpOverlay(true);
      setTimeout(() => {
        navigate(`/student/tests/${testId}/result`);
      }, 3000);
    }
  }, [session?.isFinished, session?.timeRemaining]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-zinc-500 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-zinc-400">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load test session'}</p>
          <Button onClick={() => navigate('/student/tests')} variant="outline" className="border-zinc-700 text-zinc-300 cursor-pointer">
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  const { questions, currentQuestionIndex, mcqAnswers, codeSubmissions, timeRemaining, test } = session;
  const currentQ = questions[currentQuestionIndex];
  const isLowTime = timeRemaining < 300; // less than 5 min

  // Count answered questions
  const answeredCount = questions.filter((q, i) => {
    if (q.type === 'MCQ' && q.mcqQuestion) {
      return (mcqAnswers[q.mcqQuestion.id] || []).length > 0;
    }
    if (q.type === 'CODING' && q.codingQuestion) {
      return !!codeSubmissions[q.codingQuestion.id];
    }
    return false;
  }).length;

  const unansweredCount = questions.length - answeredCount;

  // ── Question status for nav ──────────────────────────────────────────────
  const getQuestionStatus = (q: TestQuestionItem, idx: number) => {
    if (idx === currentQuestionIndex) return 'current';
    if (q.type === 'MCQ' && q.mcqQuestion) {
      return (mcqAnswers[q.mcqQuestion.id] || []).length > 0 ? 'answered' : 'unanswered';
    }
    if (q.type === 'CODING' && q.codingQuestion) {
      return codeSubmissions[q.codingQuestion.id] ? 'answered' : 'unanswered';
    }
    return 'unanswered';
  };

  const statusColors: Record<string, string> = {
    current: 'bg-blue-500 text-white',
    answered: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    unanswered: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  };

  // ── MCQ handlers ─────────────────────────────────────────────────────────
  const handleMcqSelect = (mcqId: string, optionId: string, isMulti: boolean) => {
    const current = mcqAnswers[mcqId] || [];
    let updated: string[];
    if (isMulti) {
      updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
    } else {
      updated = current.includes(optionId) ? [] : [optionId];
    }
    saveMcqAnswer(mcqId, updated);
  };

  // ── Code handlers ────────────────────────────────────────────────────────
  const handleCodeSubmit = async (questionId: string) => {
    const code = codeValues[questionId] || '';
    const language = codeLangs[questionId] || 'java';
    if (!code.trim()) return;

    setCodeSubmitStatus(prev => ({ ...prev, [questionId]: { loading: true } }));
    try {
      await submitCode(questionId, language, code);
      setCodeSubmitStatus(prev => ({ ...prev, [questionId]: { loading: false, success: true } }));
      setTimeout(() => {
        setCodeSubmitStatus(prev => ({ ...prev, [questionId]: { loading: false } }));
      }, 3000);
    } catch (err: any) {
      setCodeSubmitStatus(prev => ({ ...prev, [questionId]: { loading: false, error: err.message } }));
    }
  };

  // ── Time's up overlay ────────────────────────────────────────────────────
  if (timesUpOverlay) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Time's Up!</h2>
          <p className="text-zinc-400">Your test has been automatically submitted.</p>
          <p className="text-zinc-500 text-sm mt-2">Redirecting to results...</p>
        </div>
      </div>
    );
  }

  return (
    <ProctorOverlay isProctored={session.test.isProctored} testAttemptId={session.attemptId} maxViolations={session.test.maxViolations ?? 3} onAutoSubmit={() => finishTest().then(() => navigate(`/student/tests/${testId}/result`))}>
      <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
            SW
          </div>
          <h1 className="text-sm font-semibold text-white truncate max-w-[300px]">{test.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isLowTime ? 'bg-red-500/10 border border-red-500/30' : 'bg-zinc-800'}`}>
            <svg className={`w-4 h-4 ${isLowTime ? 'text-red-400' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-mono font-semibold ${isLowTime ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Submit button */}
          <Button
            onClick={() => setShowSubmitDialog(true)}
            disabled={session.isSubmitting}
            className="bg-red-600 hover:bg-red-500 text-white text-sm h-9 px-4 cursor-pointer"
          >
            {session.isSubmitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar: Question Nav ──────────────────────────────────── */}
        <div className="w-16 border-r border-zinc-800 bg-zinc-950 flex flex-col py-3 overflow-y-auto shrink-0">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q, idx);
            return (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`mx-2 mb-1.5 w-10 h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${statusColors[status]}`}
                title={`Question ${idx + 1} (${q.type})`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentQ && (
            <div className="flex-1 overflow-y-auto">
              {/* Question header */}
              <div className="px-6 pt-5 pb-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    Q{currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    currentQ.type === 'MCQ' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'
                  }`}>
                    {currentQ.type}
                  </span>
                  <span className="text-xs text-zinc-500">{currentQ.marks} marks</span>
                </div>
              </div>

              {/* MCQ Question */}
              {currentQ.type === 'MCQ' && currentQ.mcqQuestion && (
                <McqQuestionView
                  question={currentQ.mcqQuestion}
                  selectedOptions={mcqAnswers[currentQ.mcqQuestion.id] || []}
                  onSelect={(optionId) => handleMcqSelect(currentQ.mcqQuestion.id, optionId, currentQ.mcqQuestion.isMultiCorrect)}
                />
              )}

              {/* Coding Question — full playground layout */}
              {currentQ.type === 'CODING' && currentQ.codingQuestion && (
                <CodingQuestionView
                  question={currentQ.codingQuestion}
                  code={codeValues[currentQ.codingQuestion.id] || ''}
                  language={codeLangs[currentQ.codingQuestion.id] || 'java'}
                  onCodeChange={(code) => setCodeValues(prev => ({ ...prev, [currentQ.codingQuestion.id]: code }))}
                  onLanguageChange={(lang) => setCodeLangs(prev => ({ ...prev, [currentQ.codingQuestion.id]: lang }))}
                  onSubmit={() => handleCodeSubmit(currentQ.codingQuestion.id)}
                  submitStatus={codeSubmitStatus[currentQ.codingQuestion.id]}
                />
              )}
            </div>
          )}

          {/* ── Bottom Nav Bar ────────────────────────────────────────────── */}
          <div className="h-14 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0">
            <Button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              Previous
            </Button>

            <span className="text-xs text-zinc-500">
              {answeredCount} of {questions.length} answered
            </span>

            <Button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Dialog ──────────────────────────────────────── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Test?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {unansweredCount > 0
                ? `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?`
                : 'All questions answered. Ready to submit?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={() => { setShowSubmitDialog(false); finishTest().then(() => navigate(`/student/tests/${testId}/result`)); }}
              className="bg-red-600 hover:bg-red-500 text-white cursor-pointer"
            >
              Submit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProctorOverlay>
  );
}

// ── MCQ Question Component ───────────────────────────────────────────────────

function McqQuestionView({
  question,
  selectedOptions,
  onSelect,
}: {
  question: any;
  selectedOptions: string[];
  onSelect: (optionId: string) => void;
}) {
  const sortedOptions = [...(question.options || [])].sort((a: any, b: any) => a.order - b.order);

  return (
    <div className="p-6 max-w-3xl">
      <p className="text-white text-base leading-relaxed mb-1 whitespace-pre-wrap">{question.questionText}</p>
      <p className="text-xs text-zinc-500 mb-6">
        {question.isMultiCorrect ? 'Select all correct answers' : 'Select one answer'}
      </p>

      <div className="space-y-2.5">
        {sortedOptions.map((opt: any) => {
          const isSelected = selectedOptions.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                isSelected
                  ? 'bg-blue-500/10 border-blue-500/40 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-${question.isMultiCorrect ? 'md' : 'full'} border-2 flex items-center justify-center shrink-0 ${
                isSelected ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Coding Question Component (Playground-style) ────────────────────────────

const LANGUAGES = ['java', 'python', 'cpp'];

const DEFAULT_TEMPLATES: Record<string, string> = {
  python: '# Write your solution here\n',
  java: '// Write your solution here\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}',
  cpp: '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}',
};

function CodingQuestionView({
  question,
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onSubmit,
  submitStatus,
}: {
  question: any;
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
  onSubmit: () => void;
  submitStatus?: { loading: boolean; error?: string; success?: boolean };
}) {
  // ── Run state (compileRun — visible test cases only, no DB submission) ──
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const cleanupRunRef = useRef<(() => void) | null>(null);

  // ── Submit state (full judge via test-attempts endpoint + SSE status) ──
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalSubmissionCount, setTotalSubmissionCount] = useState(0);
  const cleanupSubmitRef = useRef<(() => void) | null>(null);

  // ── Bottom panel mode ──
  const [activePanel, setActivePanel] = useState<'run' | 'submit'>('run');

  const testCases = question.testCases || [];
  const busy = isRunning || isSubmitting || !!submitStatus?.loading;

  const handleLangChange = (lang: string) => {
    onLanguageChange(lang);
    if (!code || code === DEFAULT_TEMPLATES[language]) {
      onCodeChange(DEFAULT_TEMPLATES[lang] || '');
    }
  };

  // Initialize code if empty
  useEffect(() => {
    if (!code) onCodeChange(DEFAULT_TEMPLATES[language] || '');
  }, [question.id]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      cleanupRunRef.current?.();
      cleanupSubmitRef.current?.();
    };
  }, []);

  // Reset results when switching questions
  useEffect(() => {
    setRunResult(null);
    setSubmissionResult(null);
    setIsRunning(false);
    setIsSubmitting(false);
    setTotalSubmissionCount(0);
    setActivePanel('run');
  }, [question.id]);

  // ── Run handler (compileRun SSE — visible test cases only) ──
  const handleRun = () => {
    if (!code?.trim() || busy) return;
    cleanupRunRef.current?.();
    setIsRunning(true);
    setRunResult(null);
    setSubmissionResult(null);
    setActivePanel('run');

    cleanupRunRef.current = executionService.compileRun(
      language,
      code,
      question.id,
      (result) => { setRunResult(result); setIsRunning(false); },
      (err) => {
        setRunResult({ status: 'ERROR', score: 0, total: 0, passed: 0, failed: 0, timeUsed: 0, results: [], errorMessage: err });
        setIsRunning(false);
      },
    );
  };

  // ── Submit handler (test-attempts endpoint + SSE status tracking) ──
  const handleSubmit = async () => {
    if (!code?.trim() || busy) return;
    cleanupSubmitRef.current?.();
    setIsSubmitting(true);
    setSubmissionResult(null);
    setRunResult(null);
    setTotalSubmissionCount(0);
    setActivePanel('submit');

    try {
      // Call test-attempts submit-code endpoint (links submission to attempt)
      await onSubmit();

      // The onSubmit from parent calls submitCode in TestSessionContext which
      // returns { submissionId, totalCount, status }. We need the submissionId
      // to watch via SSE. Since onSubmit doesn't return it, we trigger the
      // test-attempt submit and also watch via SSE using the parent's submitCode.
      // Actually, let's use the submitStatus from parent for this.
      // Mark as done since parent handles the submission state.
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
    }
  };

  // Watch parent submitStatus to reflect in our UI
  useEffect(() => {
    if (submitStatus?.success) {
      setIsSubmitting(false);
      setActivePanel('submit');
    }
    if (submitStatus?.error) {
      setIsSubmitting(false);
    }
  }, [submitStatus?.success, submitStatus?.error]);

  return (
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 14rem)' }}>
      {/* ── Left Panel: Problem Description (40%) ──────────────────── */}
      <div className="w-[40%] border-r border-zinc-800 flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800 shrink-0">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Problem</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h3 className="text-white font-semibold text-base">{question.title}</h3>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{question.description}</p>

          {question.inputFormat && (
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">Input Format</p>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{question.inputFormat}</p>
            </div>
          )}
          {question.outputFormat && (
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">Output Format</p>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{question.outputFormat}</p>
            </div>
          )}
          {question.constraints && (
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">Constraints</p>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{question.constraints}</p>
            </div>
          )}

          {testCases.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">Examples</p>
              {testCases.map((tc: any, idx: number) => (
                <div key={tc.id || idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg mb-2 font-mono text-xs">
                  <p><span className="text-amber-400 font-semibold">Input: </span><span className="text-zinc-300 whitespace-pre-wrap">{tc.input}</span></p>
                  <p className="mt-1"><span className="text-emerald-400 font-semibold">Output: </span><span className="text-zinc-300 whitespace-pre-wrap">{tc.expectedOutput}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Editor (top) + Test Results (bottom) (60%) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 shrink-0">
          <select
            value={language}
            onChange={(e) => handleLangChange(e.target.value)}
            disabled={busy}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRun}
              disabled={busy}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 cursor-pointer"
            >
              {isRunning ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Run
                </span>
              )}
            </Button>
            <Button
              onClick={() => { setActivePanel('submit'); onSubmit(); }}
              disabled={busy}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-3 cursor-pointer"
            >
              {submitStatus?.loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Submit
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Monaco Editor — top portion */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            value={code || DEFAULT_TEMPLATES[language]}
            theme="vs-dark"
            onChange={(value) => onCodeChange(value ?? '')}
            options={{
              minimap: { enabled: false },
              padding: { top: 12 },
              fontSize: 14,
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {/* ── Test Results Panel (bottom) ────────────────────────────── */}
        <div className="h-[280px] border-t border-zinc-800 flex flex-col overflow-hidden shrink-0">
          {/* Panel header with mode tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-1.5 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActivePanel('run')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activePanel === 'run' ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Run Results
              </button>
              <button
                onClick={() => setActivePanel('submit')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activePanel === 'submit' ? 'bg-blue-500/15 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Submit Results
              </button>
            </div>
            {/* Status indicator */}
            <div className="text-xs">
              {isRunning && <span className="text-amber-400 animate-pulse">Running...</span>}
              {submitStatus?.loading && <span className="text-amber-400 animate-pulse">Judging...</span>}
              {submitStatus?.success && <span className="text-emerald-400">Submitted!</span>}
              {submitStatus?.error && <span className="text-red-400">{submitStatus.error}</span>}
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activePanel === 'run' && (
              <ExamRunResults
                testCases={testCases}
                runResult={runResult}
                isRunning={isRunning}
              />
            )}
            {activePanel === 'submit' && (
              <ExamSubmitResults
                testCases={testCases}
                submitStatus={submitStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Run Results (visible test cases from compileRun SSE) ──────────────────

function ExamRunResults({
  testCases,
  runResult,
  isRunning,
}: {
  testCases: any[];
  runResult: RunResult | null;
  isRunning: boolean;
}) {
  if (testCases.length === 0 && !isRunning && !runResult) {
    return <p className="text-zinc-500 text-sm">Click "Run" to test against visible test cases.</p>;
  }

  if (isRunning && !runResult) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm animate-pulse">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Running against {testCases.length} visible test case{testCases.length !== 1 ? 's' : ''}...
      </div>
    );
  }

  if (!runResult) {
    return <p className="text-zinc-500 text-sm">Click "Run" to test against visible test cases.</p>;
  }

  // Error display
  if (runResult.status !== 'ACCEPTED' && runResult.errorMessage) {
    return (
      <div>
        <div className="bg-red-900/40 border border-red-600 rounded-lg p-3 mb-3 text-sm font-mono text-red-300 whitespace-pre-wrap">
          <p className="text-red-400 font-semibold mb-1">{runResult.status}</p>
          {runResult.errorMessage}
        </div>
      </div>
    );
  }

  // Summary + per-case tabs
  return (
    <div>
      <div className="flex items-center gap-3 mb-2 text-sm">
        <span className={runResult.passed === runResult.total ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
          {runResult.status}
        </span>
        <span className="text-zinc-400">{runResult.passed}/{runResult.total} passed</span>
        <span className="text-zinc-500">{runResult.timeUsed}ms</span>
      </div>
      <Tabs defaultValue={testCases[0]?.id || 'tc-0'}>
        <TabsList className="h-auto py-0 bg-transparent gap-1">
          {testCases.map((tc: any, idx: number) => {
            const result = runResult.results.find((r) => r.testCaseId === tc.id);
            return (
              <TabsTrigger key={tc.id} value={tc.id} className="text-xs px-2 py-1 flex items-center gap-1">
                Case {idx + 1}
                {result?.status === 'PASSED' && <span className="text-emerald-400">&#10003;</span>}
                {result && result.status !== 'PASSED' && <span className="text-red-400">&#10007;</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {testCases.map((tc: any) => {
          const result = runResult.results.find((r) => r.testCaseId === tc.id);
          return (
            <TabsContent key={tc.id} value={tc.id} className="mt-2">
              <div className="space-y-2">
                {result && (
                  <div className={`text-xs font-semibold ${result.status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.status === 'PASSED' ? 'Passed' : result.status} <span className="text-zinc-500 font-normal">{result.timeUsed}ms</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1 font-medium uppercase">Input</p>
                    <pre className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs font-mono whitespace-pre-wrap text-zinc-300 max-h-20 overflow-y-auto">{tc.input}</pre>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1 font-medium uppercase">Expected</p>
                    <pre className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs font-mono text-zinc-300 max-h-20 overflow-y-auto">{tc.expectedOutput}</pre>
                  </div>
                </div>
                {result && (
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1 font-medium uppercase">Your Output</p>
                    <pre className={`p-2 rounded-lg text-xs font-mono max-h-20 overflow-y-auto ${result.status === 'PASSED' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                      {result.actualOutput}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

// ── Submit Results (from test-attempts endpoint) ──────────────────────────

function ExamSubmitResults({
  testCases,
  submitStatus,
}: {
  testCases: any[];
  submitStatus?: { loading: boolean; error?: string; success?: boolean };
}) {
  if (submitStatus?.loading) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm animate-pulse">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Judging your solution against all test cases (including hidden)...
      </div>
    );
  }

  if (submitStatus?.error) {
    return (
      <div className="bg-red-900/40 border border-red-600 rounded-lg p-3 text-sm font-mono text-red-300">
        <p className="text-red-400 font-semibold mb-1">Submission Error</p>
        {submitStatus.error}
      </div>
    );
  }

  if (submitStatus?.success) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Code submitted successfully! Marks will be calculated based on test cases passed.
      </div>
    );
  }

  return <p className="text-zinc-500 text-sm">Click "Submit" to judge against all test cases (including hidden) and record your submission.</p>;
}

// ── Page Export (Zustand store is global, no provider needed) ────────────────

export default function TestExamPage() {
  return <ExamContent />;
}
