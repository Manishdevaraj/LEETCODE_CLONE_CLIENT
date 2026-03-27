import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Navbar from '@/components/Navbar';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AdminDashboardPage() {
  const { data, isLoading, error, fetchDashboard } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400 text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400 text-lg">{error ?? 'Something went wrong'}</div>
        </div>
      </div>
    );
  }

  const usersByRole = data.usersByRole ?? [];
  const perCollegeUsers = data.perCollegeUsers ?? [];
  const perBatchStudents = data.perBatchStudents ?? [];
  const topPerformers = data.topPerformers ?? [];

  const statCards = [
    { label: 'Total Users', value: data.totalUsers ?? 0, color: 'bg-blue-500', textColor: 'text-blue-400' },
    { label: 'Active Tests', value: data.activeTests ?? 0, color: 'bg-violet-500', textColor: 'text-violet-400' },
    { label: 'Submissions Today', value: data.submissionsToday ?? 0, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { label: 'Pass Rate', value: `${data.passRate ?? 0}%`, color: 'bg-amber-500', textColor: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-zinc-400 text-sm">Platform overview and analytics</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${stat.color}`} />
                <span className="text-zinc-400 text-sm">{stat.label}</span>
              </div>
              <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Users by Role - Pie Chart */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Users by Role</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByRole}
                    dataKey="count"
                    nameKey="roleName"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ roleName, count }) => `${roleName} (${count})`}
                  >
                    {usersByRole.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* College Distribution - Bar Chart */}
          <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">College Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perCollegeUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis
                    dataKey="collegeName"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                    cursor={{ fill: 'rgba(63, 63, 70, 0.3)' }}
                  />
                  <Bar dataKey="count" name="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top Performers Table */}
        <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performers</h2>
          {topPerformers.length === 0 ? (
            <p className="text-zinc-500 text-sm">No data available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Rank</TableHead>
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400 text-right">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((performer, idx) => {
                  const avgScore = performer.avgScore ?? 0;
                  return (
                    <TableRow
                      key={performer.user?.id ?? idx}
                      className={`border-zinc-800 ${idx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-950/50'}`}
                    >
                      <TableCell className="text-zinc-300 font-medium">#{idx + 1}</TableCell>
                      <TableCell className="text-white font-medium">{performer.user?.name ?? 'N/A'}</TableCell>
                      <TableCell className="text-zinc-400">{performer.user?.email ?? ''}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            avgScore >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border-0'
                              : avgScore >= 50
                                ? 'bg-amber-500/10 text-amber-400 border-0'
                                : 'bg-red-500/10 text-red-400 border-0'
                          }
                        >
                          {avgScore.toFixed(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Batch Overview Table */}
        <Card className="bg-zinc-900 border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Batch Overview</h2>
          {perBatchStudents.length === 0 ? (
            <p className="text-zinc-500 text-sm">No batches found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Batch Name</TableHead>
                  <TableHead className="text-zinc-400 text-right">Year</TableHead>
                  <TableHead className="text-zinc-400 text-right">Student Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perBatchStudents.map((batch, idx) => (
                  <TableRow
                    key={batch.batchId}
                    className={`border-zinc-800 ${idx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-950/50'}`}
                  >
                    <TableCell className="text-white font-medium">{batch.batchName}</TableCell>
                    <TableCell className="text-zinc-300 text-right">{batch.batchYear}</TableCell>
                    <TableCell className="text-zinc-300 text-right">{batch.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
