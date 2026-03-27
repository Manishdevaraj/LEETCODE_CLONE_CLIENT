// Extracted from: src/pages/admin/McqBankPage.tsx

export interface McqCategory {
  id: string;
  name: string;
  description: string | null;
  _count?: { questions: number };
}

export interface McqBankOption {
  id?: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface McqBankQuestion {
  id: string;
  questionText: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  topic: string | null;
  explanation: string | null;
  categoryId: string;
  category?: McqCategory;
  options: McqBankOption[];
}

/** Alias used by mcq.service and other consumers. */
export type McqQuestion = McqBankQuestion;

// ---------------------------------------------------------------------------
// Payload / param types (used by mcq.service)
// ---------------------------------------------------------------------------

export interface McqCategoryCreatePayload {
  name: string;
  description?: string;
}

export interface McqCategoryUpdatePayload {
  name?: string;
  description?: string;
}

export interface McqQuestionCreatePayload {
  questionText: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  isMultiCorrect?: boolean;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  topic?: string;
  explanation?: string;
  categoryId: string;
}

export type McqQuestionUpdatePayload = Partial<McqQuestionCreatePayload>;

export interface McqQuestionListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  difficulty?: string;
  topic?: string;
}
