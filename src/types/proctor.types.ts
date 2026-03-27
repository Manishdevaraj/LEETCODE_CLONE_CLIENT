// Extracted from: src/lib/proctor.ts, src/pages/admin/ProctorReviewPage.tsx

// ---------------------------------------------------------------------------
// Core proctor types (proctor.ts)
// ---------------------------------------------------------------------------

export type ProctorEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'SCREENSHOT'
  | 'COPY_PASTE'
  | 'RIGHT_CLICK';

export interface ProctorConfig {
  testAttemptId: string;
  maxViolations: number;
  onViolation?: (type: ProctorEventType, violationCount: number, remaining: number) => void;
  onAutoSubmit?: () => void;
  onScreenShareRejected?: () => void;
}

// ---------------------------------------------------------------------------
// Proctor review page types (ProctorReviewPage.tsx)
// ---------------------------------------------------------------------------

export interface ProctorTestItem {
  id: string;
  title: string;
  status: string;
  isProctored: boolean;
  durationMins: number;
  createdAt: string;
}

export interface ProctorStudentSummary {
  userId: string;
  userName: string;
  userEmail: string;
  attemptId: string;
  totalEvents: number;
  flaggedEvents: number;
  tabSwitches: number;
  windowBlurs: number;
  screenshots: number;
  copyPastes: number;
  rightClicks: number;
}

export interface ProctorEvent {
  id: string;
  eventType: string;
  screenshotUrl: string | null;
  metadata: unknown;
  flagged: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

// ---------------------------------------------------------------------------
// Payload types (used by proctor.service)
// ---------------------------------------------------------------------------

export interface ProctorEventPayload {
  testAttemptId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}

export interface ProctorFlagPayload {
  flagged: boolean;
}
