import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { testService } from '@/services/test.service';

interface TestCategory {
  id: string;
  name: string;
  color: string | null;
}

interface TestAttempt {
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'TIMED_OUT';
  score: number | null;
  totalMarks: number | null;
  submittedAt: string | null;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  durationMins: number;
  testType: 'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string | null;
  endTime: string | null;
  totalMarks: number;
  secureToken: string;
  isProctored: boolean;
  category: TestCategory | null;
  _count: { testQuestions: number };
  myAttempt: TestAttempt | null;
}

// ---------- helpers ----------

function testTypeBadge(type: Test['testType']) {
  switch (type) {
    case 'MCQ_ONLY':
      return { label: 'MCQ', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    case 'CODING_ONLY':
      return { label: 'Coding', cls: 'bg-violet-500/15 text-violet-400 border-violet-500/30' };
    case 'COMBINED':
      return { label: 'Mixed', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
}

function scoreColor(pct: number) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `in ${days}d ${hrs % 24}h`;
}

function isAttemptDone(attempt: TestAttempt | null): boolean {
  if (!attempt) return false;
  return ['SUBMITTED', 'AUTO_SUBMITTED', 'TIMED_OUT'].includes(attempt.status);
}

// ---------- classify tests ----------

function classifyTests(tests: Test[]) {
  const active: Test[] = [];
  const upcoming: Test[] = [];
  const completed: Test[] = [];
  const missed: Test[] = [];

  for (const t of tests) {
    if (t.status === 'ACTIVE') {
      if (isAttemptDone(t.myAttempt)) {
        completed.push(t);
      } else {
        active.push(t);
      }
    } else if (t.status === 'SCHEDULED') {
      upcoming.push(t);
    } else if (t.status === 'COMPLETED' || t.status === 'CANCELLED') {
      if (t.myAttempt && isAttemptDone(t.myAttempt)) {
        completed.push(t);
      } else {
        missed.push(t);
      }
    }
  }

  return { active, upcoming, completed, missed };
}

// ---------- sub-components ----------

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${accent} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function InfoChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 rounded-md px-2 py-0.5">
      {children}
    </span>
  );
}

function TestCard({ test, section, navigate, now }: { test: Test; section: 'active' | 'upcoming' | 'completed' | 'missed'; navigate: ReturnType<typeof useNavigate>; now: number }) {
  const typeBadge = testTypeBadge(test.testType);
  const catColor = test.category?.color || '#71717a';

  const scorePct = test.myAttempt?.score != null && test.myAttempt?.totalMarks
    ? Math.round((test.myAttempt.score / test.myAttempt.totalMarks) * 100)
    : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
      {/* top row: title + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate">{test.title}</h3>
          {test.description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{test.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {test.category && (
            <Badge
              className="text-xs border"
              style={{ backgroundColor: catColor + '20', color: catColor, borderColor: catColor + '50' }}
            >
              {test.category.name}
            </Badge>
          )}
          <Badge className={`text-xs border ${typeBadge.cls}`}>{typeBadge.label}</Badge>
        </div>
      </div>

      {/* info chips */}
      <div className="flex flex-wrap items-center gap-2">
        <InfoChip>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {test.durationMins} min
        </InfoChip>
        <InfoChip>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          {test._count.testQuestions} Qs
        </InfoChip>
        <InfoChip>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          {test.totalMarks} marks
        </InfoChip>
        {test.isProctored && (
          <InfoChip>
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
            <span className="text-red-400">Proctored</span>
          </InfoChip>
        )}
      </div>

      {/* section-specific footer */}
      {section === 'active' && (
        <div className="flex items-center justify-between mt-1">
          {test.endTime && (
            <span className="text-xs text-zinc-500">Ends {formatTime(test.endTime)}</span>
          )}
          {(() => {
            const isExpired = test.endTime && new Date(test.endTime).getTime() < now;
            return (
              <Button
                size="sm"
                onClick={() => !isExpired && navigate(`/student/tests/join/${test.secureToken}`)}
                disabled={!!isExpired}
                className={isExpired
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed ml-auto"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ml-auto"}
              >
                {isExpired ? 'Expired' : 'Take Test'}
              </Button>
            );
          })()}
        </div>
      )}

      {section === 'upcoming' && test.startTime && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-zinc-400">
            {formatDate(test.startTime)} at {formatTime(test.startTime)}
          </span>
          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs">
            {timeUntil(test.startTime)}
          </Badge>
        </div>
      )}

      {section === 'completed' && test.myAttempt && scorePct !== null && (
        <div className="mt-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300 font-medium">
              {test.myAttempt.score}/{test.myAttempt.totalMarks}
              <span className="text-zinc-500 ml-1">({scorePct}%)</span>
            </span>
            <button
              onClick={() => navigate(`/student/tests/${test.id}/result`)}
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer"
            >
              View Results
            </button>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor(scorePct)} transition-all`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
        </div>
      )}

      {section === 'missed' && (
        <div className="flex items-center justify-between mt-1">
          <Badge className="bg-zinc-700/50 text-zinc-400 border border-zinc-600/50 text-xs">Missed</Badge>
        </div>
      )}
    </div>
  );
}

function TestSection({ title, tests, section, accent, navigate, now, emptyMsg }: {
  title: string;
  tests: Test[];
  section: 'active' | 'upcoming' | 'completed' | 'missed';
  accent: string;
  navigate: ReturnType<typeof useNavigate>;
  now: number;
  emptyMsg?: string;
}) {
  if (tests.length === 0 && !emptyMsg) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${accent}`} />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="text-xs text-zinc-500">({tests.length})</span>
      </div>
      {tests.length === 0 ? (
        <p className="text-sm text-zinc-500 pl-4">{emptyMsg}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map(t => (
            <TestCard key={t.id} test={t} section={section} navigate={navigate} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-28" />
        ))}
      </div>
      <div className="h-10 bg-zinc-900 rounded-lg w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-40" />
        ))}
      </div>
    </div>
  );
}

// ---------- main component ----------

export default function StudentTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTests();
  }, []);

  async function fetchTests() {
    try {
      setLoading(true);
      const data = await testService.getMyTests();
      setTests(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // join test handler
  function handleJoinTest() {
    setTokenError('');
    if (!tokenInput.trim()) {
      setTokenError('Please enter a test link or token');
      return;
    }
    let token = tokenInput.trim();
    const urlMatch = token.match(/\/join\/([^/?#]+)/);
    if (urlMatch) token = urlMatch[1];
    const paramMatch = token.match(/[?&]token=([^&#]+)/);
    if (paramMatch) token = paramMatch[1];
    navigate(`/student/tests/join/${token}`);
  }

  // derived data
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null; count: number }>();
    for (const t of tests) {
      if (t.category) {
        const existing = map.get(t.category.id);
        if (existing) existing.count++;
        else map.set(t.category.id, { name: t.category.name, color: t.category.color, count: 1 });
      }
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [tests]);

  const filteredTests = useMemo(() => {
    let list = tests;
    if (activeCategory !== 'all') {
      list = list.filter(t => t.category?.id === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q));
    }
    return list;
  }, [tests, activeCategory, search]);

  const { active, upcoming, completed, missed } = useMemo(
    () => classifyTests(filteredTests),
    [filteredTests]
  );

  // stats
  const stats = useMemo(() => {
    const all = classifyTests(tests);
    const completedWithScore = all.completed.filter(t => t.myAttempt?.score != null && t.myAttempt?.totalMarks);
    const avgScore = completedWithScore.length > 0
      ? Math.round(completedWithScore.reduce((sum, t) => sum + ((t.myAttempt!.score! / t.myAttempt!.totalMarks!) * 100), 0) / completedWithScore.length)
      : 0;
    return {
      total: tests.length,
      completed: all.completed.length,
      avgScore,
      upcoming: all.upcoming.length,
    };
  }, [tests]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">My Tests</h1>
          <p className="text-sm text-zinc-400">View and take tests assigned to your batch.</p>
        </div>

        {/* Join test (compact) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400 whitespace-nowrap">Join via token:</span>
            <Input
              placeholder="Paste secure test link or token..."
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value); setTokenError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinTest()}
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 h-9"
            />
            <Button
              onClick={handleJoinTest}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white px-5 cursor-pointer"
            >
              Join
            </Button>
          </div>
          {tokenError && <p className="text-red-400 text-xs mt-1.5 ml-[calc(6rem)]">{tokenError}</p>}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchTests} className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer">
              Retry
            </Button>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-1">No tests yet</h3>
            <p className="text-sm text-zinc-400">No tests have been assigned to your batch yet.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Tests"
                value={stats.total}
                accent="bg-blue-500/10"
                icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
              />
              <StatCard
                label="Completed"
                value={stats.completed}
                accent="bg-emerald-500/10"
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard
                label="Average Score"
                value={`${stats.avgScore}%`}
                accent="bg-amber-500/10"
                icon={<svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
              />
              <StatCard
                label="Upcoming"
                value={stats.upcoming}
                accent="bg-violet-500/10"
                icon={<svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
              />
            </div>

            {/* Category tabs + search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="flex-1 overflow-x-auto">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap cursor-pointer transition-colors ${
                      activeCategory === 'all'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                    }`}
                  >
                    All ({tests.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap cursor-pointer transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>
              <Input
                placeholder="Search tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 h-9"
              />
            </div>

            {/* Test sections */}
            <TestSection
              title="Active Now"
              tests={active}
              section="active"
              accent="bg-emerald-500"
              navigate={navigate}
              now={now}
            />
            <TestSection
              title="Upcoming"
              tests={upcoming}
              section="upcoming"
              accent="bg-blue-500"
              navigate={navigate}
              now={now}
            />
            <TestSection
              title="Completed"
              tests={completed}
              section="completed"
              accent="bg-amber-500"
              navigate={navigate}
              now={now}
            />
            <TestSection
              title="Missed"
              tests={missed}
              section="missed"
              accent="bg-zinc-500"
              navigate={navigate}
              now={now}
            />

            {filteredTests.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <p className="text-sm text-zinc-400">No tests match your filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
