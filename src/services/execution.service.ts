import apiClient, { API_BASE } from '@/lib/axios';
import type { RunResult, SubmissionResult } from '@/types/submission.types';

export const executionService = {
  /**
   * POST /compilerun -> get jobId, then SSE stream until type=complete.
   * Returns a cleanup function to close the EventSource early.
   */
  compileRun(
    language: string,
    code: string,
    questionId: string,
    onComplete: (result: RunResult) => void,
    onError: (err: string) => void,
  ): () => void {
    let es: EventSource | null = null;

    apiClient
      .post<{ jobId: string }>('/compilerun', { questionId, language, code })
      .then(({ data: { jobId } }) => {
        es = new EventSource(`${API_BASE}/compilerun/${jobId}/events`);

        es.onmessage = (e: MessageEvent) => {
          const parsed = JSON.parse(e.data as string) as { type: string; result?: RunResult };
          if (parsed.type === 'complete') {
            onComplete(parsed.result!);
            es?.close();
          }
        };

        es.onerror = () => {
          onError('Connection lost');
          es?.close();
        };
      })
      .catch((err: Error) => onError(err.message));

    return () => es?.close();
  },

  /**
   * POST /execute -> get submissionId, then SSE /status/{submissionId} until type=complete.
   * Returns a cleanup function to close the EventSource early.
   */
  submitCode(
    language: string,
    code: string,
    questionId: string,
    onPending: (totalCount: number) => void,
    onComplete: (result: SubmissionResult) => void,
    onError: (err: string) => void,
  ): () => void {
    let es: EventSource | null = null;

    apiClient
      .post<{ submissionId: string; totalCount: number }>('/execute', { questionId, language, code })
      .then(({ data: { submissionId, totalCount } }) => {
        onPending(totalCount);
        es = new EventSource(`${API_BASE}/status/${submissionId}`);

        es.onmessage = (e: MessageEvent) => {
          const parsed = JSON.parse(e.data as string) as { type: string; submission?: SubmissionResult };
          if (parsed.type === 'complete') {
            onComplete(parsed.submission!);
            es?.close();
          }
        };

        es.onerror = () => {
          onError('Connection lost');
          es?.close();
        };
      })
      .catch((err: Error) => onError(err.message));

    return () => es?.close();
  },
};
