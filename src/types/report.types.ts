// Extracted from: src/pages/admin/ReportsPage.tsx
// The reports page does not define explicit interfaces; it uses inline `any`
// responses. These types capture the shapes consumed in the component.

export interface ReportTestItem {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Report response types (used by report.service)
// Shapes are intentionally loose; refine once backend contracts are stable.
// ---------------------------------------------------------------------------

export interface TestReport {
  [key: string]: unknown;
}

export interface TestParticipationReport {
  [key: string]: unknown;
}

export interface BatchReport {
  [key: string]: unknown;
}

export interface CollegeComparisonReport {
  [key: string]: unknown;
}

export interface StudentReport {
  [key: string]: unknown;
}

export interface CourseProgressReport {
  [key: string]: unknown;
}

export interface TrendsReport {
  [key: string]: unknown;
}
