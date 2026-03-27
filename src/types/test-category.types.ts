// Re-export TestCategory from test.types so consumers can import from either location
export type { TestCategory } from './test.types';

export interface TestCategoryCreatePayload {
  name: string;
  description?: string;
  color?: string;
}

export interface TestCategoryUpdatePayload {
  name?: string;
  description?: string;
  color?: string;
}
