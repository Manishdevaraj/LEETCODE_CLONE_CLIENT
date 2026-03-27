import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { testAttemptService } from '@/services/test-attempt.service';

interface McqAnswerResult {
  mcqQuestionId: string;
  questionText: string;
  selectedOptions: string[];
  correctOptions: string[];
  options: { id: string; text: string }[];
  isCorrect: boolean;
  marks: number;
  marksObtained: number;
}

interface CodeSubmissionResult {
  questionId: string;
  questionTitle: string;
  language: string;
  status: string;
  marks: number;
  marksObtained: number;
}

interface TestAttemptResult {
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

export default function TestResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestAttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testId) return;
    testAttemptService.getAttempt(testId)
      .then((data) => {
        const attempt = (data as Record<string, unknown>).attempt || data;
        const a = attempt as Record<string, unknown>;
        const test = (a.test || { title: 'Test', type: 'MIXED', durationMins: 0 }) as Record<string, unknown>;
        setResult({
          id: a.id as string,
          testId: (a.testId as string) || testId,
          status: a.status as string,
          score: (a.score as number) ?? 0,
          totalMarks: (a.totalMarks as number) ?? (test.totalMarks as number) ?? 0,
          startedAt: a.startedAt as string,
          finishedAt: (a.finishedAt as string) || null,
          test: test as TestAttemptResult['test'],
          mcqResults: ((a.mcqResults || a.mcqAnswers || []) as McqAnswerResult[]),
          codeResults: ((a.codeResults || a.codeSubmissions || []) as CodeSubmissionResult[]),
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [testId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-zinc-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md text-center">
            <p className="text-red-400 mb-4">{error || 'Failed to load test results'}</p>
            <Button onClick={() => navigate('/student/tests')} variant="outline" className="border-zinc-700 text-zinc-300 cursor-pointer">
              Back to Tests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const percentage = result.totalMarks > 0
    ? Math.round((result.score / result.totalMarks) * 100)
    : 0;

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
    EVALUATED: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Evaluated' },
    SUBMITTED: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Submitted' },
    IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'In Progress' },
  };
  const sc = statusConfig[result.status] || statusConfig.COMPLETED;

  const scoreColor = percentage >= 70 ? 'text-emerald-400' : percentage >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{result.test.title}</h1>
            <p className="text-sm text-zinc-400">
              {result.finishedAt
                ? `Submitted ${new Date(result.finishedAt).toLocaleString()}`
                : `Started ${new Date(result.startedAt).toLocaleString()}`}
            </p>
          </div>
          <Button
            onClick={() => navigate('/student/tests')}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
          >
            Back to Tests
          </Button>
        </div>

        {/* Score Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400 mb-2">Your Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${scoreColor}`}>{result.score}</span>
                <span className="text-xl text-zinc-500">/ {result.totalMarks}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                  {sc.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${scoreColor}`}>{percentage}%</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 w-full bg-zinc-800 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                percentage >= 70 ? 'bg-emerald-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* MCQ Results */}
        {result.mcqResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">MCQ Questions</h2>
            <div className="space-y-3">
              {result.mcqResults.map((mcq, idx) => (
                <div key={mcq.mcqQuestionId || idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Q{idx + 1}</span>
                      <p className="text-sm text-white font-medium">{mcq.questionText}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        mcq.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {mcq.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="text-xs text-zinc-500">{mcq.marksObtained}/{mcq.marks}</span>
                    </div>
                  </div>

                  {mcq.options && mcq.options.length > 0 && (
                    <div className="space-y-1.5 ml-8">
                      {mcq.options.map((opt) => {
                        const wasSelected = mcq.selectedOptions?.includes(opt.id);
                        const isCorrectOpt = mcq.correctOptions?.includes(opt.id);
                        let optClass = 'text-zinc-500';
                        if (isCorrectOpt) optClass = 'text-emerald-400';
                        else if (wasSelected && !isCorrectOpt) optClass = 'text-red-400';

                        return (
                          <div key={opt.id} className={`flex items-center gap-2 text-sm ${optClass}`}>
                            {wasSelected ? (
                              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            ) : (
                              <span className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{opt.text}</span>
                            {isCorrectOpt && <span className="text-xs text-emerald-500 ml-1">(correct)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coding Results */}
        {result.codeResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Coding Questions</h2>
            <div className="space-y-3">
              {result.codeResults.map((sub, idx) => {
                const isAccepted = sub.status === 'ACCEPTED';
                return (
                  <div key={sub.questionId || idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Q{result.mcqResults.length + idx + 1}</span>
                        <p className="text-sm text-white font-medium">{sub.questionTitle || `Coding Question ${idx + 1}`}</p>
                        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-400 uppercase font-mono">
                          {sub.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isAccepted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {sub.status}
                        </span>
                        <span className="text-xs text-zinc-500">{sub.marksObtained ?? 0}/{sub.marks}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No results yet */}
        {result.mcqResults.length === 0 && result.codeResults.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-400 text-sm">
              {result.status === 'COMPLETED' || result.status === 'SUBMITTED'
                ? 'Your test is being evaluated. Check back soon for detailed results.'
                : 'No results available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
