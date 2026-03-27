import apiClient from '@/lib/axios';
import type {
  ProctorEventPayload,
  ProctorStudentSummary,
  ProctorEvent,
  ProctorFlagPayload,
} from '@/types/proctor.types';

export const proctorService = {
  /** Log a proctor event (tab switch, fullscreen exit, copy/paste, etc.) */
  async logEvent(payload: ProctorEventPayload): Promise<void> {
    await apiClient.post('/proctor/event', payload);
  },

  /** Upload a screenshot captured during proctoring */
  async uploadScreenshot(testAttemptId: string, file: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('file', file, `screenshot-${Date.now()}.png`);
    formData.append('testAttemptId', testAttemptId);
    await apiClient.post('/proctor/screenshot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Get proctor event summary for all students in a test */
  async getTestSummary(testId: string): Promise<ProctorStudentSummary[]> {
    const { data } = await apiClient.get<ProctorStudentSummary[]>(
      `/proctor/events/${testId}/summary`,
    );
    return data;
  },

  /** Get proctor events for a specific student in a test */
  async getStudentEvents(testId: string, userId: string): Promise<ProctorEvent[]> {
    const { data } = await apiClient.get<ProctorEvent[]>(
      `/proctor/events/${testId}/${userId}`,
    );
    return data;
  },

  /** Toggle flag on a proctor event */
  async toggleFlag(eventId: string, payload: ProctorFlagPayload): Promise<void> {
    await apiClient.patch(`/proctor/events/${eventId}/flag`, payload);
  },
};
