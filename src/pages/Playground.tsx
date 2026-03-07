// @ts-nocheck
//@ts-ignore
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TestCaseRunner, { CodeEditor, DescriptionUi } from "@/components/Playground"
import Navbar from '@/components/Navbar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { fetchQuestion, submitCode, type Question, type RunResult, type SubmissionResult } from '@/lib/editor.action'

const Playground = () => {
  const { questionId } = useParams<{ questionId: string }>();

  const [question, setQuestion] = useState<Question | null>(null);

  // Run state
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Submit state
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalSubmissionCount, setTotalSubmissionCount] = useState(0);
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0);

  useEffect(() => {
    if (!questionId) return;
    fetchQuestion(questionId)
      .then(setQuestion)
      .catch(console.error);
  }, [questionId]);

  const handleSubmit = useCallback((language: string, code: string) => {
    if (!questionId) return;
    setIsSubmitting(true);
    setSubmissionResult(null);
    setTotalSubmissionCount(0);
    setRunResult(null);
    submitCode(
      language,
      code,
      questionId,
      (total) => setTotalSubmissionCount(total),
      (result) => { setSubmissionResult(result); setIsSubmitting(false); setSubmissionsRefreshKey(k => k + 1); },
      (err) => {
        console.error('Submit error:', err);
        setSubmissionResult({
          id: '', language, code, status: 'ERROR', score: 0, timeUsed: 0,
          memoryUsed: null, results: [], errorMessage: err,
          createdAt: '', userId: '', questionId,
        });
        setIsSubmitting(false);
      },
    );
  }, [questionId]);

  return (
    <div className="w-full h-screen flex flex-col bg-zinc-950">
      <Navbar />
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel>
          <DescriptionUi question={question} submissionsRefreshKey={submissionsRefreshKey} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel>
              <CodeEditor
                question={question}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                onRunStart={() => {
                  setIsRunning(true);
                  setRunResult(null);
                  setSubmissionResult(null);
                  setTotalSubmissionCount(0);
                }}
                onRunComplete={(result: RunResult) => { setRunResult(result); setIsRunning(false); }}
                onSubmit={handleSubmit}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <TestCaseRunner
                testCases={question?.testCases ?? []}
                runResult={runResult}
                isRunning={isRunning}
                submissionResult={submissionResult}
                isSubmitting={isSubmitting}
                totalSubmissionCount={totalSubmissionCount}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default Playground
