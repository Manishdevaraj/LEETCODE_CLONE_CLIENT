// Extracted from: src/pages/admin/BulkUploadPage.tsx

export interface UploadResultRow {
  row: number;
  email: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

export interface UploadError {
  row: number;
  message: string;
}

export interface UploadResult {
  total: number;
  created: number;
  skipped: number;
  errors: UploadError[];
  details: UploadResultRow[];
}

/** Alias used by bulk-upload.service. */
export type BulkUploadResult = UploadResult;
