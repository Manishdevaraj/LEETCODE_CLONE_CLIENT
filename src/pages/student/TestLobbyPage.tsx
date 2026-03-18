// @ts-nocheck
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { API_BASE, authFetch } from '@/lib/api';

interface QuestionBreakdown {
  mcq: { count: number; marks: number };
  coding: { count: number; marks: number };
}

interface TestPreview {
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

export default function TestLobbyPage() {
  const { secureToken } = useParams<{ secureToken: string }>();
  const navigate = useNavigate();

  const [testInfo, setTestInfo] = useState<TestPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');

  // Fetch test info
  useEffect(() => {
    if (!secureToken) return;
    setIsLoading(true);
    authFetch(`${API_BASE}/tests/join/${secureToken}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load test');
        const raw = data.test || data;
        setTestInfo({ ...raw, type: raw.testType || raw.type });
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [secureToken]);

  const handleStartTest = async () => {
    if (!testInfo) return;
    if (!password.trim()) {
      setStartError('Password is required');
      return;
    }
    if (testInfo.requiresAccessCode && !accessCode.trim()) {
      setStartError('Access code is required for this test');
      return;
    }

    setIsStarting(true);
    setStartError('');

    try {
      const res = await authFetch(`${API_BASE}/test-attempts/${testInfo.id}/verify-and-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() || undefined, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to start test');

      // Enter fullscreen before navigating to exam for proctored tests
      if (testInfo.isProctored && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.error('Failed to enter fullscreen:', err);
        }
      }

      navigate(`/student/tests/${testInfo.id}/exam`);
    } catch (err: any) {
      setStartError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !testInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Unable to Load Test</h2>
            <p className="text-sm text-zinc-400 mb-4">{error || 'Test not found. The link may be invalid or expired.'}</p>
            <Button
              onClick={() => navigate('/student/tests')}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              Back to My Tests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Test type badge ────────────────────────────────────────────────────────
  const typeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      MCQ: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      CODING: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
      MIXED: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    };
    const c = config[type] || config.MIXED;
    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>{type}</span>;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-lg w-full">
          {/* Test info header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              {typeBadge(testInfo.type)}
              {testInfo.isProctored && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                  Proctored
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{testInfo.title}</h1>
            {testInfo.description && (
              <p className="text-sm text-zinc-400 leading-relaxed">{testInfo.description}</p>
            )}
          </div>

          {/* Test overview */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Duration</p>
              <p className="text-sm font-semibold text-white">{testInfo.durationMins} min</p>
            </div>
            <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Questions</p>
              <p className="text-sm font-semibold text-white">{testInfo.totalQuestions || '--'}</p>
            </div>
            <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Marks</p>
              <p className="text-sm font-semibold text-white">{testInfo.totalMarks || '--'}</p>
            </div>
          </div>

          {/* Question breakdown by type */}
          {testInfo.breakdown && (
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Marks Breakdown</p>

              {testInfo.breakdown.mcq.count > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-zinc-300">MCQ Questions</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-400">{testInfo.breakdown.mcq.count} questions</span>
                    <span className="text-white font-semibold">{testInfo.breakdown.mcq.marks} marks</span>
                  </div>
                </div>
              )}

              {testInfo.breakdown.coding.count > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-sm text-zinc-300">Coding Questions</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-400">{testInfo.breakdown.coding.count} questions</span>
                    <span className="text-white font-semibold">{testInfo.breakdown.coding.marks} marks</span>
                  </div>
                </div>
              )}

              {/* Total row */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
                <span className="text-sm font-semibold text-zinc-300">Total</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-400">{testInfo.totalQuestions} questions</span>
                  <span className="text-white font-bold">{testInfo.totalMarks} marks</span>
                </div>
              </div>
            </div>
          )}

          {/* Important notices */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-amber-400 mb-2">Before you start:</p>
            <ul className="text-xs text-zinc-400 space-y-1">
              <li>- The timer starts immediately once you begin the test.</li>
              <li>- Your test will be auto-submitted when time runs out.</li>
              <li>- Make sure you have a stable internet connection.</li>
              {testInfo.isProctored && (
                <>
                  <li>- This test is proctored. Your browser will enter fullscreen mode.</li>
                  <li>- Exiting fullscreen is a violation. After {testInfo.maxViolations ?? 3} violations, your test will be auto-submitted.</li>
                  <li>- Copy, paste, and right-click are disabled during the test.</li>
                </>
              )}
            </ul>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {testInfo.requiresAccessCode && (
              <div>
                <Label htmlFor="accessCode" className="text-sm text-zinc-300 mb-1.5 block">
                  Access Code
                </Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-sm text-zinc-300 mb-1.5 block">
                Your Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your account password to verify"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setStartError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleStartTest()}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>

            {startError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <p className="text-sm text-red-400">{startError}</p>
              </div>
            )}

            <Button
              onClick={handleStartTest}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white h-11 text-sm font-semibold cursor-pointer"
            >
              {isStarting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Starting Test...
                </span>
              ) : (
                'Start Test'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
