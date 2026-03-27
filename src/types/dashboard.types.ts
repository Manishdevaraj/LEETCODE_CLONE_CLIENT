// Dashboard data shape as returned by the API and consumed by AdminDashboardPage

export interface DashboardData {
  totalUsers: number;
  activeTests: number;
  submissionsToday: number;
  passRate: number;
  usersByRole: { roleName: string; count: number }[];
  perCollegeUsers: { collegeName: string; count: number }[];
  perBatchStudents: { batchId: string; batchName: string; batchYear: number; count: number }[];
  topPerformers: {
    avgScore: number;
    user?: { id: string; name: string; email: string };
    [key: string]: unknown;
  }[];
}
