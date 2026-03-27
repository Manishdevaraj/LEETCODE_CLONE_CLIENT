import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { courseProgressService } from '@/services/course-progress.service';
import { useCourseProgressStore } from '@/stores/courseProgressStore';
import { executionService } from '@/services/execution.service';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import type {
  CourseSubModule,
  PracticeQuestionItem,
  McqOptionItem,
  PracticeMcqResult,
} from '@/types/course.types';
import type { RunResult, SubmissionResult } from '@/types/submission.types';

const LANGUAGES = ['java', 'python', 'cpp'] as const;
type Language = (typeof LANGUAGES)[number];

// ── Main Page ───────────────────────────────────────────────────────────────

export default function CoursePracticePage() {
  const { courseId, dayNum, subModuleId } = useParams<{
    courseId: string;
    dayNum: string;
    subModuleId: string;
  }>();
  const navigate = useNavigate();
  const { markPracticeComplete } = useCourseProgressStore();

  const [subModule, setSubModule] = useState<CourseSubModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dayNumber = Number(dayNum);

  useEffect(() => {
    if (!courseId || !subModuleId || isNaN(dayNumber)) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    courseProgressService
      .getPracticeSubModule(courseId, dayNumber, subModuleId)
      .then((data) => {
        if (!cancelled) setSubModule(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, dayNumber, subModuleId]);

  // Mark a practice question complete (local state update + store)
  const handleMarkComplete = useCallback(
    async (practiceQuestionId: string) => {
      if (!courseId) return;
      try {
        await markPracticeComplete(courseId, practiceQuestionId);
        setSubModule((prev) => {
          if (!prev?.practiceQuestions) return prev;
          return {
            ...prev,
            practiceQuestions: prev.practiceQuestions.map((pq) =>
              pq.id === practiceQuestionId ? { ...pq, isCompleted: true } : pq,
            ),
          };
        });
      } catch {
        // silently ignore — store will surface error if needed
      }
    },
    [courseId, markPracticeComplete],
  );

  // ── Loading / Error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-zinc-500 mx-auto mb-3"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-zinc-400">Loading practice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subModule) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md text-center">
            <p className="text-red-400 mb-4">
              {error || 'Practice module not found'}
            </p>
            <Button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              variant="outline"
              className="border-zinc-700 text-zinc-300 cursor-pointer"
            >
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derive question lists ─────────────────────────────────────────────────

  const allQuestions = [...(subModule.practiceQuestions ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const mcqQuestions = allQuestions.filter((q) => !!q.mcqQuestionId);
  const codingQuestions = allQuestions.filter((q) => !!q.questionId);
  const completedCount = allQuestions.filter((q) => q.isCompleted).length;
  const totalCount = allQuestions.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const practiceType = subModule.practiceType ?? 'COMBINED';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate(`/student/courses/${courseId}`)}
            variant="ghost"
            className="text-zinc-400 hover:text-white mb-3 -ml-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Course
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {subModule.title}
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Day {dayNumber} — Practice
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-sm">
                {completedCount}/{totalCount} completed
              </span>
              <div className="w-32">
                <Progress value={progressPct} className="h-2 bg-zinc-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Content by practice type */}
        {practiceType === 'MCQ_ONLY' && (
          <McqSection
            questions={mcqQuestions}
            courseId={courseId!}
            subModuleId={subModuleId!}
            onMarkComplete={handleMarkComplete}
          />
        )}

        {practiceType === 'CODING_ONLY' && (
          <CodingSection
            questions={codingQuestions}
            courseId={courseId!}
            onMarkComplete={handleMarkComplete}
          />
        )}

        {practiceType === 'COMBINED' && (
          <Tabs defaultValue="mcq" className="flex-1 flex flex-col">
            <TabsList className="bg-zinc-900 border border-zinc-800 self-start mb-4">
              <TabsTrigger
                value="mcq"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 cursor-pointer"
              >
                MCQ Questions ({mcqQuestions.length})
              </TabsTrigger>
              <TabsTrigger
                value="coding"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 cursor-pointer"
              >
                Coding Questions ({codingQuestions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mcq" className="flex-1 mt-0">
              <McqSection
                questions={mcqQuestions}
                courseId={courseId!}
                subModuleId={subModuleId!}
                onMarkComplete={handleMarkComplete}
              />
            </TabsContent>

            <TabsContent value="coding" className="flex-1 mt-0">
              <CodingSection
                questions={codingQuestions}
                courseId={courseId!}
                onMarkComplete={handleMarkComplete}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// ── MCQ Section ─────────────────────────────────────────────────────────────

interface McqSectionProps {
  questions: PracticeQuestionItem[];
  courseId: string;
  subModuleId: string;
  onMarkComplete: (practiceQuestionId: string) => Promise<void>;
}

function McqSection({ questions, courseId, subModuleId, onMarkComplete }: McqSectionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PracticeMcqResult | null>(null);

  const question = questions[currentIdx];

  // Reset selection when navigating questions
  useEffect(() => {
    setSelectedOption(null);
    setResult(null);
  }, [currentIdx]);

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">No MCQ questions in this module.</p>
      </div>
    );
  }

  if (!question?.mcqQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Question data not available.</p>
      </div>
    );
  }

  const mcq = question.mcqQuestion;
  const options = mcq.options ?? [];

  const handleCheckAnswer = async () => {
    if (selectedOption === null || !mcq.id) return;
    setIsChecking(true);
    try {
      const res = await courseProgressService.submitPracticeMcqAnswer(courseId, {
        mcqQuestionId: mcq.id,
        selectedOption,
        subModuleId,
      });
      setResult(res);
      // Auto-mark complete
      if (!question.isCompleted) {
        await onMarkComplete(question.id);
      }
    } catch {
      // ignore
    } finally {
      setIsChecking(false);
    }
  };

  const difficultyColor = (d: string) => {
    const dl = d.toLowerCase();
    if (dl === 'easy') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (dl === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Question Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex-1">
        {/* Question header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              Q{currentIdx + 1} of {questions.length}
            </span>
            <Badge className={`text-xs ${difficultyColor(mcq.difficulty)}`}>
              {mcq.difficulty}
            </Badge>
            {question.isCompleted && (
              <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Completed
              </Badge>
            )}
          </div>
        </div>

        {/* Question text */}
        <h2 className="text-lg font-semibold text-white mb-6">
          {mcq.questionText}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const hasResult = result !== null;
            const isCorrectOption =
              hasResult && result.correctOption?.label === opt.label;
            const isWrongSelection =
              hasResult && isSelected && !result.isCorrect;

            let borderClass = 'border-zinc-700 hover:border-zinc-600';
            if (hasResult && isCorrectOption) {
              borderClass = 'border-green-500 bg-green-500/10';
            } else if (isWrongSelection) {
              borderClass = 'border-red-500 bg-red-500/10';
            } else if (isSelected && !hasResult) {
              borderClass = 'border-blue-500 bg-blue-500/10';
            }

            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (!hasResult) setSelectedOption(idx);
                }}
                disabled={hasResult}
                className={`w-full text-left p-4 rounded-lg border transition-colors flex items-center gap-4 ${borderClass} ${hasResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    isSelected && !hasResult
                      ? 'bg-blue-500 text-white'
                      : hasResult && isCorrectOption
                        ? 'bg-green-500 text-white'
                        : isWrongSelection
                          ? 'bg-red-500 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`text-sm ${
                    hasResult && isCorrectOption
                      ? 'text-green-300'
                      : isWrongSelection
                        ? 'text-red-300'
                        : 'text-zinc-300'
                  }`}
                >
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result feedback */}
        {result && (
          <div
            className={`p-4 rounded-lg border mb-6 ${
              result.isCorrect
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <p
              className={`font-semibold text-sm ${
                result.isCorrect ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {result.isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            {!result.isCorrect && result.correctOption && (
              <p className="text-zinc-400 text-sm mt-1">
                Correct answer: {result.correctOption.label} -{' '}
                {result.correctOption.text}
              </p>
            )}
            {result.explanation && (
              <p className="text-zinc-400 text-sm mt-2">{result.explanation}</p>
            )}
          </div>
        )}

        {/* Check Answer button */}
        {!result && (
          <Button
            onClick={handleCheckAnswer}
            disabled={selectedOption === null || isChecking}
            className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white cursor-pointer"
          >
            {isChecking ? 'Checking...' : 'Check Answer'}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          variant="outline"
          className="border-zinc-700 text-zinc-300 cursor-pointer"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </Button>

        {/* Question dots */}
        <div className="flex items-center gap-1.5">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                idx === currentIdx
                  ? 'bg-blue-500 text-white'
                  : q.isCompleted
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <Button
          onClick={() =>
            setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
          }
          disabled={currentIdx === questions.length - 1}
          variant="outline"
          className="border-zinc-700 text-zinc-300 cursor-pointer"
        >
          Next
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}

// ── Coding Section ──────────────────────────────────────────────────────────

interface CodingSectionProps {
  questions: PracticeQuestionItem[];
  courseId: string;
  onMarkComplete: (practiceQuestionId: string) => Promise<void>;
}

function CodingSection({ questions, courseId, onMarkComplete }: CodingSectionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">No coding questions in this module.</p>
      </div>
    );
  }

  const question = questions[currentIdx];

  return (
    <div className="flex-1 flex flex-col">
      {/* Question navigation */}
      {questions.length > 1 && (
        <div className="flex items-center gap-1.5 mb-4">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                idx === currentIdx
                  ? 'bg-blue-500 text-white'
                  : q.isCompleted
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      {question && (
        <CodingQuestionPanel
          key={question.id}
          practiceQuestion={question}
          courseId={courseId}
          onMarkComplete={onMarkComplete}
        />
      )}
    </div>
  );
}

// ── Coding Question Panel ───────────────────────────────────────────────────

interface CodingQuestionPanelProps {
  practiceQuestion: PracticeQuestionItem;
  courseId: string;
  onMarkComplete: (practiceQuestionId: string) => Promise<void>;
}

function CodingQuestionPanel({
  practiceQuestion,
  courseId,
  onMarkComplete,
}: CodingQuestionPanelProps) {
  const [language, setLanguage] = useState<Language>('java');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'run' | 'submit'>('run');
  const cleanupRef = useRef<(() => void) | null>(null);

  const questionId = practiceQuestion.questionId;
  const questionInfo = practiceQuestion.question;

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handleRun = () => {
    if (!questionId || !code.trim()) return;
    setIsRunning(true);
    setRunResult(null);
    setSubmitResult(null);
    setErrorMsg(null);
    setActiveResultTab('run');

    cleanupRef.current?.();
    cleanupRef.current = executionService.compileRun(
      language,
      code,
      questionId,
      (result) => {
        setRunResult(result);
        setIsRunning(false);
      },
      (err) => {
        setErrorMsg(err);
        setIsRunning(false);
      },
    );
  };

  const handleSubmit = () => {
    if (!questionId || !code.trim()) return;
    setIsSubmitting(true);
    setRunResult(null);
    setSubmitResult(null);
    setErrorMsg(null);
    setActiveResultTab('submit');

    cleanupRef.current?.();
    cleanupRef.current = executionService.submitCode(
      language,
      code,
      questionId,
      () => {
        // onPending — nothing special needed
      },
      async (result) => {
        setSubmitResult(result);
        setIsSubmitting(false);
        // Auto-mark complete on ACCEPTED
        if (
          result.status === 'ACCEPTED' &&
          !practiceQuestion.isCompleted
        ) {
          await onMarkComplete(practiceQuestion.id);
        }
      },
      (err) => {
        setErrorMsg(err);
        setIsSubmitting(false);
      },
    );
  };

  const difficultyColor = (d: string) => {
    const dl = d.toLowerCase();
    if (dl === 'easy') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (dl === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="flex-1 flex gap-4 min-h-0">
      {/* Left Panel: Question Info */}
      <div className="w-80 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          {questionInfo && (
            <>
              <h3 className="text-white font-semibold text-base">
                {questionInfo.title}
              </h3>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {questionInfo && (
            <Badge className={`text-xs ${difficultyColor(questionInfo.difficulty)}`}>
              {questionInfo.difficulty}
            </Badge>
          )}
          {practiceQuestion.isCompleted && (
            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Completed
            </Badge>
          )}
        </div>

        {!questionInfo && (
          <p className="text-zinc-500 text-sm">
            Question details not available.
          </p>
        )}
      </div>

      {/* Right Panel: Editor + Results */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-t-xl px-4 py-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-zinc-600 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRun}
              disabled={isRunning || isSubmitting || !code.trim()}
              variant="outline"
              className="border-zinc-700 text-zinc-300 text-sm h-8 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <svg
                    className="animate-spin w-3.5 h-3.5 mr-1.5"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                  </svg>
                  Run
                </>
              )}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting || !code.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm h-8 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-3.5 h-3.5 mr-1.5"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 border-x border-zinc-800 min-h-[300px]">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 12 },
            }}
          />
        </div>

        {/* Results Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-b-xl p-4 max-h-64 overflow-y-auto">
          {/* Error */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Run Results */}
          {runResult && activeResultTab === 'run' && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-sm font-semibold ${
                    runResult.status === 'ACCEPTED'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {runResult.status}
                </span>
                <span className="text-zinc-500 text-xs">
                  {runResult.passed}/{runResult.total} passed
                </span>
                <span className="text-zinc-500 text-xs">
                  {runResult.timeUsed}ms
                </span>
              </div>

              {runResult.errorMessage && (
                <pre className="text-red-400 text-xs bg-zinc-800 rounded p-3 mb-3 whitespace-pre-wrap">
                  {runResult.errorMessage}
                </pre>
              )}
              {runResult.runtimeError && (
                <pre className="text-red-400 text-xs bg-zinc-800 rounded p-3 mb-3 whitespace-pre-wrap">
                  {runResult.runtimeError}
                </pre>
              )}

              <div className="space-y-1.5">
                {runResult.results.map((tc, idx) => (
                  <div
                    key={tc.testCaseId ?? idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      tc.status === 'PASSED'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <span>
                      {tc.isHidden ? 'Hidden' : `Test Case ${idx + 1}`}
                    </span>
                    <span className="font-medium">{tc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Results */}
          {submitResult && activeResultTab === 'submit' && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-sm font-semibold ${
                    submitResult.status === 'ACCEPTED'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {submitResult.status}
                </span>
                <span className="text-zinc-500 text-xs">
                  Score: {submitResult.score}
                </span>
                <span className="text-zinc-500 text-xs">
                  {submitResult.timeUsed}ms
                </span>
              </div>

              {submitResult.errorMessage && (
                <pre className="text-red-400 text-xs bg-zinc-800 rounded p-3 mb-3 whitespace-pre-wrap">
                  {submitResult.errorMessage}
                </pre>
              )}

              <div className="space-y-1.5">
                {submitResult.results.map((tc, idx) => (
                  <div
                    key={tc.testCaseId ?? idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      tc.status === 'PASSED'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <span>
                      {tc.isHidden ? 'Hidden' : `Test Case ${idx + 1}`}
                    </span>
                    <span className="font-medium">{tc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!errorMsg && !runResult && !submitResult && (
            <p className="text-zinc-500 text-sm text-center py-2">
              Run or submit your code to see results here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
