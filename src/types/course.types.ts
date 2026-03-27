// ---------------------------------------------------------------------------
// Shared content types
// ---------------------------------------------------------------------------

export interface ContentItem {
  id: string;
  title: string;
  contentType: 'VIDEO' | 'PDF';
  url: string;
  order: number;
  durationMins: number | null;
  isCompleted?: boolean;
}

export interface PracticeQuestionItem {
  id: string;
  order: number;
  questionId?: string;
  mcqQuestionId?: string;
  question?: { id: string; title: string; difficulty: string };
  mcqQuestion?: { id: string; questionText: string; difficulty: string; options?: McqOptionItem[] };
  isCompleted?: boolean;
}

export interface McqOptionItem {
  id: string;
  label: string;
  text: string;
  isCorrect?: boolean;
}

export interface CourseSubModule {
  id: string;
  title: string;
  subModuleType: 'LEARNING' | 'PRACTICE';
  practiceType?: 'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED';
  order: number;
  contents?: ContentItem[];
  practiceQuestions?: PracticeQuestionItem[];
}

export interface CourseDay {
  id: string;
  dayNumber: number;
  title: string;
  scheduledUnlockDate?: string | null;
  subModules?: CourseSubModule[];
}

// ---------------------------------------------------------------------------
// Admin-side
// ---------------------------------------------------------------------------

export interface CourseBatch {
  id: string;
  batchId: string;
  batch?: { id: string; name: string; department?: { id: string; name: string } };
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  totalDays: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  days?: CourseDay[];
  batchAssignments?: CourseBatch[];
  _count?: { days: number; batchAssignments: number };
}

export interface CourseDetail extends Course {
  days: CourseDay[];
  batchAssignments: CourseBatch[];
}

// ---------------------------------------------------------------------------
// Student-side progress
// ---------------------------------------------------------------------------

export interface SubModuleProgress {
  id: string;
  title: string;
  type: 'LEARNING' | 'PRACTICE';
  totalItems: number;
  completedItems: number;
  percentage: number;
}

export interface DayProgressBreakdown {
  dayNumber: number;
  title: string;
  scheduledUnlockDate?: string | null;
  locked: boolean;
  totalItems: number;
  completedItems: number;
  percentage: number;
  subModules: SubModuleProgress[];
}

export interface CourseProgressDetail {
  courseId: string;
  title: string;
  description: string | null;
  totalDays: number;
  completedDayNum: number;
  totalItems: number;
  completedItems: number;
  percentage: number;
  days: DayProgressBreakdown[];
}

export interface CourseProgressSummary {
  course: Course;
  progress: {
    id: string | null;
    completedDayNum: number;
    updatedAt: string | null;
    userId: string;
    courseId: string;
  };
  totalItems: number;
  completedDayNum: number;
}

export interface PracticeMcqResult {
  isCorrect: boolean;
  correctOption: { label: string; text: string } | null;
  explanation: string | null;
}

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface CourseCreatePayload {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface CourseUpdatePayload {
  title?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  startDate?: string | null;
  endDate?: string | null;
}

export interface CourseDayPayload {
  title: string;
  dayNumber?: number;
  scheduledUnlockDate?: string | null;
}

export interface CreateSubModulePayload {
  title: string;
  subModuleType: 'LEARNING' | 'PRACTICE';
  practiceType?: 'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED';
  order?: number;
}

export interface UpdateSubModulePayload {
  title?: string;
  subModuleType?: 'LEARNING' | 'PRACTICE';
  practiceType?: 'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED';
  order?: number;
}

export interface CourseContentPayload {
  title: string;
  contentType: 'VIDEO' | 'PDF';
  url: string;
  order?: number;
  durationMins?: number;
}

export interface AddPracticeQuestionPayload {
  questionId?: string;
  mcqQuestionId?: string;
  order?: number;
}

export interface CourseBatchAssignPayload {
  batchIds: string[];
}

export interface SubmitPracticeMcqPayload {
  mcqQuestionId: string;
  selectedOption: number;
  subModuleId: string;
}
