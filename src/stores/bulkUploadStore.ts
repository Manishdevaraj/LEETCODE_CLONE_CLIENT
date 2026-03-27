import { create } from 'zustand';
import { bulkUploadService } from '@/services/bulk-upload.service';

interface BulkUploadStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  uploading: boolean;
  error: string | null;

  downloadStudentTemplate: () => Promise<void>;
  downloadStaffTemplate: () => Promise<void>;
  uploadStudents: (file: File) => Promise<void>;
  uploadStaff: (file: File) => Promise<void>;
  clearError: () => void;
  clearResult: () => void;
}

export const useBulkUploadStore = create<BulkUploadStore>()((set) => ({
  result: null,
  uploading: false,
  error: null,

  downloadStudentTemplate: async () => {
    try {
      const blob = await bulkUploadService.downloadStudentTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  downloadStaffTemplate: async () => {
    try {
      const blob = await bulkUploadService.downloadStaffTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'staff-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  uploadStudents: async (file) => {
    set({ uploading: true, error: null, result: null });
    try {
      const result = await bulkUploadService.uploadStudents(file);
      set({ result, uploading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, uploading: false });
    }
  },

  uploadStaff: async (file) => {
    set({ uploading: true, error: null, result: null });
    try {
      const result = await bulkUploadService.uploadStaff(file);
      set({ result, uploading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, uploading: false });
    }
  },

  clearError: () => set({ error: null }),
  clearResult: () => set({ result: null }),
}));
