// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { API_BASE, authFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function downloadExcel(url: string, filename: string) {
  const res = await authFetch(url);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#fff' },
};

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
    </div>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-red-400 text-sm">
      {message}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-12 text-center text-zinc-500 text-sm">{text}</p>;
}

// ─── Test Selector ──────────────────────────────────────────────────────────

function TestSelector({
  tests,
  value,
  onChange,
}: {
  tests: any[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-72 bg-zinc-900 border-zinc-700 text-white">
        <SelectValue placeholder="Select a test" />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
        {tests.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Tab 1: Test Results ────────────────────────────────────────────────────

function TestResultsTab({ tests }: { tests: any[] }) {
  const [testId, setTestId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_BASE}/reports/test/${id}?format=json`);
      if (!res.ok) throw new Error('Failed to load test results');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (testId) load(testId);
  }, [testId, load]);

  // Build score distribution for chart
  const distribution = data?.results
    ? (() => {
        const buckets: Record<string, number> = {
          '0-20%': 0,
          '21-40%': 0,
          '41-60%': 0,
          '61-80%': 0,
          '81-100%': 0,
        };
        data.results.forEach((r: any) => {
          const pct = r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0;
          if (pct <= 20) buckets['0-20%']++;
          else if (pct <= 40) buckets['21-40%']++;
          else if (pct <= 60) buckets['41-60%']++;
          else if (pct <= 80) buckets['61-80%']++;
          else buckets['81-100%']++;
        });
        return Object.entries(buckets).map(([range, count]) => ({ range, count }));
      })()
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TestSelector tests={tests} value={testId} onChange={setTestId} />
        {testId && (
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() =>
              downloadExcel(
                `${API_BASE}/reports/test/${testId}?format=xlsx`,
                'test-results.xlsx'
              )
            }
          >
            Download Excel
          </Button>
        )}
      </div>

      {!testId && <EmptyState text="Select a test to view results" />}
      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {data && !loading && (
        <>
          {/* Score Distribution Chart */}
          {distribution.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="range" tick={{ fill: '#a1a1aa' }} stroke="#3f3f46" />
                  <YAxis tick={{ fill: '#a1a1aa' }} stroke="#3f3f46" allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Results Table */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Student Name</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400 text-right">Score</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total</TableHead>
                  <TableHead className="text-zinc-400 text-right">%</TableHead>
                  <TableHead className="text-zinc-400 text-right">Time Taken</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.results ?? []).map((r: any, i: number) => {
                  const pct = r.totalMarks > 0 ? ((r.score / r.totalMarks) * 100).toFixed(1) : '0';
                  return (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell className="text-white">{r.studentName ?? r.name ?? '-'}</TableCell>
                      <TableCell className="text-zinc-400">{r.email ?? '-'}</TableCell>
                      <TableCell className="text-right text-white">{r.score}</TableCell>
                      <TableCell className="text-right text-zinc-400">{r.totalMarks}</TableCell>
                      <TableCell className="text-right text-white">{pct}%</TableCell>
                      <TableCell className="text-right text-zinc-400">
                        {r.timeTaken ? `${Math.round(r.timeTaken / 60)}m` : '-'}
                      </TableCell>
                      <TableCell>
                        {r.status === 'pass' || r.passed ? (
                          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                            Pass
                          </Badge>
                        ) : (
                          <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                            Fail
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {(!data.results || data.results.length === 0) && (
              <EmptyState text="No results found for this test" />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Tab 2: Participation ───────────────────────────────────────────────────

function ParticipationTab({ tests }: { tests: any[] }) {
  const [testId, setTestId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    setError('');
    authFetch(`${API_BASE}/reports/test/${testId}/participation?format=json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load participation data');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  const rows = data?.batches ?? data?.participation ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TestSelector tests={tests} value={testId} onChange={setTestId} />
        {testId && (
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() =>
              downloadExcel(
                `${API_BASE}/reports/test/${testId}/participation?format=xlsx`,
                'participation.xlsx'
              )
            }
          >
            Download Excel
          </Button>
        )}
      </div>

      {!testId && <EmptyState text="Select a test to view participation" />}
      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {data && !loading && (
        <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Batch Name</TableHead>
                <TableHead className="text-zinc-400 text-right">Total Students</TableHead>
                <TableHead className="text-zinc-400 text-right">Participated</TableHead>
                <TableHead className="text-zinc-400 text-right">Absent</TableHead>
                <TableHead className="text-zinc-400 w-64">Participation %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any, i: number) => {
                const pct =
                  r.participationPercent ??
                  (r.totalStudents > 0
                    ? ((r.participated / r.totalStudents) * 100).toFixed(1)
                    : 0);
                return (
                  <TableRow key={i} className="border-zinc-800">
                    <TableCell className="text-white">{r.batchName ?? r.batch ?? '-'}</TableCell>
                    <TableCell className="text-right text-zinc-400">{r.totalStudents}</TableCell>
                    <TableCell className="text-right text-white">{r.participated}</TableCell>
                    <TableCell className="text-right text-zinc-400">{r.absent ?? r.totalStudents - r.participated}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${Math.min(Number(pct), 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-300 w-14 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {rows.length === 0 && <EmptyState text="No participation data found" />}
        </Card>
      )}
    </div>
  );
}

// ─── Tab 3: Batch Performance ───────────────────────────────────────────────

function BatchPerformanceTab() {
  const [batchId, setBatchId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!batchId.trim()) return;
    setLoading(true);
    setError('');
    authFetch(`${API_BASE}/reports/batch/${batchId.trim()}?format=json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load batch performance');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [batchId]);

  const distribution = data?.scoreDistribution ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Enter Batch ID"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="w-72 bg-zinc-900 border-zinc-700 text-white"
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <Button onClick={load} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Load Report
        </Button>
        {data && (
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() =>
              downloadExcel(
                `${API_BASE}/reports/batch/${batchId.trim()}?format=xlsx`,
                'batch-performance.xlsx'
              )
            }
          >
            Download Excel
          </Button>
        )}
      </div>

      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {data && !loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <p className="text-sm text-zinc-400">Avg Score</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {data.avgScore ?? data.averageScore ?? '-'}
              </p>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <p className="text-sm text-zinc-400">Pass Rate</p>
              <p className="text-2xl font-semibold text-emerald-400 mt-1">
                {data.passRate ?? data.passPercent ?? '-'}%
              </p>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <p className="text-sm text-zinc-400">Total Students</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {data.totalStudents ?? '-'}
              </p>
            </Card>
          </div>

          {/* Score Distribution */}
          {distribution.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="range" tick={{ fill: '#a1a1aa' }} stroke="#3f3f46" />
                  <YAxis tick={{ fill: '#a1a1aa' }} stroke="#3f3f46" allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Top Performers */}
          {data.topPerformers && data.topPerformers.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Performers</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">#</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Email</TableHead>
                    <TableHead className="text-zinc-400 text-right">Score</TableHead>
                    <TableHead className="text-zinc-400 text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPerformers.map((s: any, i: number) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell className="text-zinc-500">{i + 1}</TableCell>
                      <TableCell className="text-white">{s.name ?? s.studentName}</TableCell>
                      <TableCell className="text-zinc-400">{s.email}</TableCell>
                      <TableCell className="text-right text-white">{s.score}</TableCell>
                      <TableCell className="text-right text-emerald-400">{s.percent ?? s.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Bottom Performers */}
          {data.bottomPerformers && data.bottomPerformers.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Bottom Performers</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">#</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Email</TableHead>
                    <TableHead className="text-zinc-400 text-right">Score</TableHead>
                    <TableHead className="text-zinc-400 text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.bottomPerformers.map((s: any, i: number) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell className="text-zinc-500">{i + 1}</TableCell>
                      <TableCell className="text-white">{s.name ?? s.studentName}</TableCell>
                      <TableCell className="text-zinc-400">{s.email}</TableCell>
                      <TableCell className="text-right text-white">{s.score}</TableCell>
                      <TableCell className="text-right text-red-400">{s.percent ?? s.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {!data && !loading && !error && <EmptyState text="Enter a Batch ID and click Load Report" />}
    </div>
  );
}

// ─── Tab 4: College Comparison ──────────────────────────────────────────────

function CollegeComparisonTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    authFetch(`${API_BASE}/reports/college-comparison?format=json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load college comparison');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const colleges = data?.colleges ?? data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium text-white">College Comparison</h3>
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 ml-auto"
          onClick={() =>
            downloadExcel(
              `${API_BASE}/reports/college-comparison?format=xlsx`,
              'college-comparison.xlsx'
            )
          }
        >
          Download Excel
        </Button>
      </div>

      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {!loading && Array.isArray(colleges) && colleges.length > 0 && (
        <>
          {/* Chart */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Average Score by College</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={colleges}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="collegeName" tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#a1a1aa' }} stroke="#3f3f46" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="avgScore" name="Avg Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passRate" name="Pass Rate %" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Table */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">College Name</TableHead>
                  <TableHead className="text-zinc-400 text-right">Avg Score</TableHead>
                  <TableHead className="text-zinc-400 text-right">Participation %</TableHead>
                  <TableHead className="text-zinc-400 text-right">Pass Rate %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colleges.map((c: any, i: number) => (
                  <TableRow key={i} className="border-zinc-800">
                    <TableCell className="text-white">{c.collegeName ?? c.name}</TableCell>
                    <TableCell className="text-right text-white">{c.avgScore}</TableCell>
                    <TableCell className="text-right text-zinc-400">
                      {c.participationPercent ?? c.participation ?? '-'}%
                    </TableCell>
                    <TableCell className="text-right text-emerald-400">
                      {c.passRate ?? c.passPercent ?? '-'}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {!loading && Array.isArray(colleges) && colleges.length === 0 && (
        <EmptyState text="No college comparison data available" />
      )}
    </div>
  );
}

// ─── Tab 5: Student Card ────────────────────────────────────────────────────

function StudentCardTab() {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setSearchResults([]);
    try {
      const res = await authFetch(`${API_BASE}/users?search=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      setSearchResults(json.users ?? json ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const loadStudent = useCallback(async (id: string) => {
    setUserId(id);
    setLoading(true);
    setError('');
    setSearchResults([]);
    try {
      const res = await authFetch(`${API_BASE}/reports/student/${id}?format=json`);
      if (!res.ok) throw new Error('Failed to load student report');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const trendData = data?.trends ?? data?.testScores ?? [];

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-80 bg-zinc-900 border-zinc-700 text-white"
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <Button onClick={search} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Search
        </Button>
        {userId && data && (
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 ml-auto"
            onClick={() =>
              downloadExcel(
                `${API_BASE}/reports/student/${userId}?format=xlsx`,
                'student-card.xlsx'
              )
            }
          >
            Download Excel
          </Button>
        )}
      </div>

      {/* Search results dropdown */}
      {searching && <Loader />}
      {searchResults.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-2">Select a student:</p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {searchResults.map((u: any) => (
              <button
                key={u.id}
                onClick={() => loadStudent(u.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span className="text-white">{u.name ?? u.fullName}</span>
                <span className="text-zinc-500 ml-2 text-sm">{u.email}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {error && <ErrorMsg message={error} />}
      {loading && <Loader />}

      {data && !loading && (
        <>
          {/* Student Info */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xl font-bold">
                {(data.student?.name ?? data.name ?? '?')[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {data.student?.name ?? data.name}
                </h3>
                <p className="text-sm text-zinc-400">{data.student?.email ?? data.email}</p>
                {(data.student?.batch ?? data.batch) && (
                  <p className="text-sm text-zinc-500 mt-1">
                    Batch: {data.student?.batch ?? data.batch}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Test scores */}
          {(data.testScores ?? data.scores ?? []).length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Test Scores</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Test</TableHead>
                    <TableHead className="text-zinc-400 text-right">Score</TableHead>
                    <TableHead className="text-zinc-400 text-right">Total</TableHead>
                    <TableHead className="text-zinc-400 text-right">%</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.testScores ?? data.scores ?? []).map((s: any, i: number) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell className="text-white">{s.testTitle ?? s.test}</TableCell>
                      <TableCell className="text-right text-white">{s.score}</TableCell>
                      <TableCell className="text-right text-zinc-400">{s.totalMarks ?? s.total}</TableCell>
                      <TableCell className="text-right text-white">{s.percent ?? s.percentage}%</TableCell>
                      <TableCell>
                        {s.passed || s.status === 'pass' ? (
                          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">Pass</Badge>
                        ) : (
                          <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Fail</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Course progress */}
          {(data.courseProgress ?? []).length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Course Progress</h3>
              <div className="space-y-3">
                {data.courseProgress.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-white text-sm w-48 truncate">{c.courseName ?? c.course}</span>
                    <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${c.completion ?? c.progress ?? 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-zinc-400 w-12 text-right">
                      {c.completion ?? c.progress ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Trend Chart */}
          {trendData.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Score Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="testTitle" tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" />
                  <YAxis tick={{ fill: '#a1a1aa' }} stroke="#3f3f46" />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="percent"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      {!data && !loading && !searching && searchResults.length === 0 && (
        <EmptyState text="Search for a student by name or email to view their report card" />
      )}
    </div>
  );
}

// ─── Tab 6: Course Progress ─────────────────────────────────────────────────

function CourseProgressTab() {
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch(`${API_BASE}/courses`)
      .then((res) => res.json())
      .then((json) => setCourses(json.courses ?? json ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    setError('');
    authFetch(`${API_BASE}/reports/course/${courseId}/progress?format=json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load course progress');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const rows = data?.batches ?? data?.progress ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="w-72 bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {courses.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title ?? c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {courseId && (
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() =>
              downloadExcel(
                `${API_BASE}/reports/course/${courseId}/progress?format=xlsx`,
                'course-progress.xlsx'
              )
            }
          >
            Download Excel
          </Button>
        )}
      </div>

      {!courseId && <EmptyState text="Select a course to view progress" />}
      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {data && !loading && (
        <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Batch</TableHead>
                <TableHead className="text-zinc-400 text-right">Completion Rate %</TableHead>
                <TableHead className="text-zinc-400 text-right">Avg Days Completed</TableHead>
                <TableHead className="text-zinc-400 text-right">Students Stuck</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any, i: number) => (
                <TableRow key={i} className="border-zinc-800">
                  <TableCell className="text-white">{r.batchName ?? r.batch}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${r.completionRate ?? r.completion ?? 0}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">
                        {r.completionRate ?? r.completion ?? 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-zinc-400">
                    {r.avgDaysCompleted ?? r.avgDays ?? '-'}
                  </TableCell>
                  <TableCell className="text-right text-amber-400">
                    {r.studentsStuck ?? r.stuck ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 && <EmptyState text="No course progress data found" />}
        </Card>
      )}
    </div>
  );
}

// ─── Tab 7: Trends ──────────────────────────────────────────────────────────

function TrendsTab() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    authFetch(`${API_BASE}/reports/trends?period=${period}&format=json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load trends');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const rows = data?.trends ?? data?.periods ?? data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              period === 'weekly'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 ml-auto"
          onClick={() =>
            downloadExcel(
              `${API_BASE}/reports/trends?period=${period}&format=xlsx`,
              `trends-${period}.xlsx`
            )
          }
        >
          Download Excel
        </Button>
      </div>

      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {!loading && Array.isArray(rows) && rows.length > 0 && (
        <>
          {/* Line Chart */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">
              Average Scores - {period === 'weekly' ? 'Weekly' : 'Monthly'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="period" tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" />
                <YAxis tick={{ fill: '#a1a1aa' }} stroke="#3f3f46" />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                  name="Avg Score"
                />
                {rows[0]?.participation !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="participation"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                    name="Participation %"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Data Table */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Period</TableHead>
                  <TableHead className="text-zinc-400 text-right">Avg Score</TableHead>
                  <TableHead className="text-zinc-400 text-right">Tests Conducted</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total Participants</TableHead>
                  <TableHead className="text-zinc-400 text-right">Pass Rate %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any, i: number) => (
                  <TableRow key={i} className="border-zinc-800">
                    <TableCell className="text-white">{r.period ?? r.label}</TableCell>
                    <TableCell className="text-right text-white">{r.avgScore ?? '-'}</TableCell>
                    <TableCell className="text-right text-zinc-400">
                      {r.testsConducted ?? r.tests ?? '-'}
                    </TableCell>
                    <TableCell className="text-right text-zinc-400">
                      {r.totalParticipants ?? r.participants ?? '-'}
                    </TableCell>
                    <TableCell className="text-right text-emerald-400">
                      {r.passRate ?? r.passPercent ?? '-'}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {!loading && Array.isArray(rows) && rows.length === 0 && (
        <EmptyState text="No trend data available" />
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    authFetch(`${API_BASE}/tests`)
      .then((res) => res.json())
      .then((json) => setTests(json.tests ?? json ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Reports Hub</h1>
          <p className="text-zinc-400 mt-1">
            View and download reports across tests, batches, colleges, students, and courses.
          </p>
        </div>

        <Tabs defaultValue="test-results" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex flex-wrap gap-1 h-auto">
            <TabsTrigger
              value="test-results"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-400 rounded-md px-3 py-1.5 text-sm"
            >
              Test Results
            </TabsTrigger>
            <TabsTrigger
              value="participation"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-400 rounded-md px-3 py-1.5 text-sm"
            >
              Participation
            </TabsTrigger>
            <TabsTrigger
              value="batch-performance"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-400 rounded-md px-3 py-1.5 text-sm"
            >
              Batch Performance
            </TabsTrigger>
            <TabsTrigger
              value="college-comparison"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-400 rounded-md px-3 py-1.5 text-sm"
            >
              College Comparison
            </TabsTrigger>
            <TabsTrigger
              value="student-card"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-400 rounded-md px-3 py-1.5 text-sm"
            >
              Student Card
            </TabsTrigger>
            <TabsTrigger
              value="course-progress"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-400 rounded-md px-3 py-1.5 text-sm"
            >
              Course Progress
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-400 rounded-md px-3 py-1.5 text-sm"
            >
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test-results">
            <TestResultsTab tests={tests} />
          </TabsContent>

          <TabsContent value="participation">
            <ParticipationTab tests={tests} />
          </TabsContent>

          <TabsContent value="batch-performance">
            <BatchPerformanceTab />
          </TabsContent>

          <TabsContent value="college-comparison">
            <CollegeComparisonTab />
          </TabsContent>

          <TabsContent value="student-card">
            <StudentCardTab />
          </TabsContent>

          <TabsContent value="course-progress">
            <CourseProgressTab />
          </TabsContent>

          <TabsContent value="trends">
            <TrendsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
