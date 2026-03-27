import apiClient from '@/lib/axios';
import type { BulkUploadResult } from '@/types/bulk-upload.types';

export const bulkUploadService = {
  /** Download the student upload CSV template */
  async downloadStudentTemplate(): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/bulk-upload/template', {
      responseType: 'blob',
    });
    return data;
  },

  /** Download the staff upload CSV template */
  async downloadStaffTemplate(): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/bulk-upload/staff-template', {
      responseType: 'blob',
    });
    return data;
  },

  /** Upload a CSV/XLSX file to bulk-create student accounts */
  async uploadStudents(file: File): Promise<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<BulkUploadResult>('/bulk-upload/students', formData);
    return data;
  },

  /** Upload a CSV/XLSX file to bulk-create staff accounts */
  async uploadStaff(file: File): Promise<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<BulkUploadResult>('/bulk-upload/staff', formData);
    return data;
  },
};
