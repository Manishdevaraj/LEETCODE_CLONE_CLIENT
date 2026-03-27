import { useEffect, useState } from 'react'
import { IoIosFlask, IoIosTimer } from 'react-icons/io'
import { MdOutlineDescription } from 'react-icons/md'
import { SiTicktick } from 'react-icons/si'
import Editor from "@monaco-editor/react";
import { FaPlay, FaCheck } from "react-icons/fa";
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { executionService } from '@/services/execution.service'
import { submissionService } from '@/services/submission.service'
import type { ApiTestCase, Question } from '@/types/question.types'
import type { RunResult, SubmissionResult, SubmissionSummary, SubmissionTestResult } from '@/types/submission.types'

// ─── SubmissionsList ──────────────────────────────────────────────────────────

function SubmissionsList({ questionId }: { questionId: string }) {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    submissionService.getByQuestion(questionId)
      .then(data => { setSubmissions(data); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [questionId]);

  if (loading) return <p className="text-zinc-500 text-sm animate-pulse">Loading submissions...</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (submissions.length === 0) return <p className="text-zinc-500 text-sm">No submissions yet.</p>;

  const statusColor = (s: string) =>
    s === 'ACCEPTED' ? 'text-emerald-400' :
    s === 'PENDING' || s === 'RUNNING' ? 'text-amber-400' : 'text-red-400';

  const statusBg = (s: string) =>
    s === 'ACCEPTED' ? 'bg-emerald-500/10' :
    s === 'PENDING' || s === 'RUNNING' ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <div className="space-y-2">
      {submissions.map(sub => (
        <div key={sub.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBg(sub.status)} ${statusColor(sub.status)}`}>
              {sub.status.replace(/_/g, ' ')}
            </span>
            <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-400 uppercase font-mono">
              {sub.language}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {sub.score > 0 && <span className="font-medium">{sub.score} pts</span>}
            {sub.timeUsed != null && <span>{sub.timeUsed}ms</span>}
            <span>{new Date(sub.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DescriptionUi ────────────────────────────────────────────────────────────

const triggerCls =
  'flex items-center gap-2 rounded-none border-b-2 border-transparent ' +
  'data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 ' +
  'data-[state=active]:bg-transparent text-zinc-500 hover:text-zinc-300 py-3 px-1 text-sm transition-colors';

interface DescriptionUiProps {
  question: Question | null;
  submissionsRefreshKey?: number;
}

export const DescriptionUi = ({ question, submissionsRefreshKey = 0 }: DescriptionUiProps) => {
  if (!question) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-zinc-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const diffConfig =
    question.difficulty === 'EASY' ? { text: 'text-emerald-400', bg: 'bg-emerald-500/10' } :
    question.difficulty === 'MEDIUM' ? { text: 'text-amber-400', bg: 'bg-amber-500/10' } :
    { text: 'text-red-400', bg: 'bg-red-500/10' };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      <Tabs defaultValue="description" className="flex flex-col h-full">
        {/* Tab headers */}
        <TabsList className="w-full justify-start rounded-none border-b border-zinc-800 bg-transparent px-4 h-auto py-0 gap-3 shrink-0">
          <TabsTrigger value="description" className={triggerCls}>
            <MdOutlineDescription className="text-xl" /> Description
          </TabsTrigger>
          <TabsTrigger value="solution" className={triggerCls}>
            <IoIosFlask className="text-xl" /> Solution
          </TabsTrigger>
          <TabsTrigger value="submissions" className={triggerCls}>
            <IoIosTimer className="text-xl" /> Submissions
          </TabsTrigger>
        </TabsList>

        {/* Description */}
        <TabsContent value="description" className="flex-1 overflow-y-auto p-6 mt-0">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">{question.title}</h2>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${diffConfig.bg} ${diffConfig.text}`}>
              {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
            </span>
            {question.topic && (
              <span className="text-xs bg-zinc-800 px-2.5 py-0.5 rounded-full text-zinc-400">
                {question.topic}
              </span>
            )}
          </div>
          <div className="flex gap-4 text-xs text-zinc-500 mb-5">
            <span className="flex items-center gap-1">
              <IoIosTimer className="text-sm" /> {question.timeLimit}ms
            </span>
            <span>{question.memoryLimit}MB memory</span>
            {question.totalSubmissions > 0 && (
              <span className="flex items-center gap-1">
                <SiTicktick className="text-emerald-500 text-sm" />
                {((question.acceptedSubmissions / question.totalSubmissions) * 100).toFixed(1)}% acceptance
              </span>
            )}
          </div>
           
          <p className="leading-relaxed whitespace-pre-wrap mb-6 text-zinc-300 text-sm">{question.description}</p>
          <p className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">Input Format</p>
          <p className="leading-relaxed whitespace-pre-wrap mb-6 text-zinc-300 text-sm">{question.inputFormat}</p>
          <p className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">Output Format</p>
          <p className="leading-relaxed whitespace-pre-wrap mb-6 text-zinc-300 text-sm">{question.outputFormat}</p>

          {question.testCases.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider">Examples</p>
              {question.testCases.map((tc, idx) => (
                <div key={tc.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-3 font-mono text-sm">
                  <p className="text-zinc-500 text-xs mb-2 font-sans">Example {idx + 1}</p>
                  <div className="space-y-1.5">
                    <p><span className="text-amber-400 font-semibold">Input: </span><span className="text-zinc-300">{tc.input}</span></p>
                    <p><span className="text-emerald-400 font-semibold">Output: </span><span className="text-zinc-300">{tc.expectedOutput}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">Constraints</p>
          <p className="leading-relaxed whitespace-pre-wrap mb-6 text-zinc-300 text-sm">{question.constraints}</p>
        </TabsContent>

        {/* Solution */}
        <TabsContent value="solution" className="flex-1 overflow-y-auto p-6 mt-0">
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <svg className="w-10 h-10 mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm">Solution not available yet.</p>
          </div>
        </TabsContent>

        {/* Submissions */}
        <TabsContent value="submissions" className="flex-1 overflow-y-auto p-6 mt-0">
          <SubmissionsList key={submissionsRefreshKey} questionId={question.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── CodeEditor ───────────────────────────────────────────────────────────────

const languages = ["java", "python", "cpp"];

const defaultTemplate: Record<string, string> = {
  python: "# Write your solution here\ndef solution():\n    pass",
  java: "// Write your solution here\npublic class Main {\n    public void solve() {\n        \n    }\n}",
  cpp: "// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}",
};

interface CodeEditorProps {
  question: Question | null;
  isRunning: boolean;
  isSubmitting: boolean;
  onRunStart: () => void;
  onRunComplete: (result: RunResult) => void;
  onSubmit: (language: string, code: string) => void;
}

export const CodeEditor = ({ question, isRunning, isSubmitting, onRunStart, onRunComplete, onSubmit }: CodeEditorProps) => {
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(defaultTemplate["java"]);

  const busy = isRunning || isSubmitting;

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(defaultTemplate[lang]);
  };

  const runCode = () => {
    if (!question || busy) return;
    onRunStart();
    executionService.compileRun(
      language,
      code,
      question.id,
      onRunComplete,
      (err) => {
        console.error('Run error:', err);
        onRunComplete({ status: 'ERROR', score: 0, total: 0, passed: 0, failed: 0, timeUsed: 0, results: [], errorMessage: err });
      },
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Code
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            disabled={busy}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
          <Button
            className="bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg cursor-pointer"
            onClick={runCode}
            disabled={!question || busy}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Running
              </>
            ) : (
              <>
                <FaPlay className="text-[10px]" /> Run
              </>
            )}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg cursor-pointer"
            onClick={() => { if (!question || busy) return; onSubmit(language, code); }}
            disabled={!question || busy}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Submitting
              </>
            ) : (
              <>
                <FaCheck className="text-[10px]" /> Submit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value ?? '')}
          options={{ minimap: { enabled: false }, padding: { top: 12 } }}
        />
      </div>
    </div>
  );
};

// ─── TestCaseRunner ───────────────────────────────────────────────────────────

interface TestCaseRunnerProps {
  testCases: ApiTestCase[];
  runResult: RunResult | null;
  isRunning: boolean;
  submissionResult: SubmissionResult | null;
  isSubmitting: boolean;
  totalSubmissionCount: number;
}

export default function TestCaseRunner({
  testCases,
  runResult,
  isRunning,
  submissionResult,
  isSubmitting,
  totalSubmissionCount,
}: TestCaseRunnerProps) {

  // ── Submit mode ────────────────────────────────────────────────────────────
  if (isSubmitting || submissionResult !== null) {
    // Build ordered tab list: visible test cases first, then hidden results
    type TabItem = {
      key: string;
      label: string;
      tc: ApiTestCase | null;
      result: SubmissionTestResult | null;
      loading: boolean;
    };

    const tabs: TabItem[] = [];

    if (isSubmitting) {
      const count = totalSubmissionCount > 0 ? totalSubmissionCount : 1;
      for (let i = 0; i < count; i++) {
        tabs.push({ key: `loading-${i}`, label: `Case ${i + 1}`, tc: null, result: null, loading: true });
      }
    } else if (submissionResult) {
      // 1. Visible test cases (in question order)
      testCases.forEach((tc, idx) => {
        const result = submissionResult.results.find(r => r.testCaseId === tc.id) ?? null;
        tabs.push({ key: tc.id, label: `Case ${idx + 1}`, tc, result, loading: false });
      });
      // 2. Hidden test cases
      submissionResult.results
        .filter(r => r.isHidden)
        .forEach((result, i) => {
          tabs.push({
            key: result.testCaseId,
            label: `Case ${testCases.length + i + 1}`,
            tc: null,
            result,
            loading: false,
          });
        });
    }

    const passedCount = submissionResult?.results.filter(r => r.status === 'PASSED').length ?? 0;
    const totalCount = submissionResult?.results.length ?? 0;

    return (
      <div className="w-full bg-zinc-950 p-4 h-full overflow-y-auto">
        {/* Summary bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold">Test Cases</p>
          {isSubmitting ? (
            <span className="text-amber-400 text-sm animate-pulse">
              Judging...{totalSubmissionCount > 0 ? ` ${totalSubmissionCount} test cases` : ''}
            </span>
          ) : submissionResult && (
            <div className="flex items-center gap-3 text-sm">
              <span className={submissionResult.status === 'ACCEPTED' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                {submissionResult.status}
              </span>
              <span className="text-zinc-400">{passedCount}/{totalCount} passed</span>
              <span className="text-zinc-400">{submissionResult.timeUsed}ms</span>
            </div>
          )}
        </div>

        {/* Error / compile block */}
        {submissionResult && submissionResult.status !== 'ACCEPTED' && submissionResult.errorMessage && (
          <div className="bg-red-900/40 border border-red-600 rounded-lg p-3 mb-3 text-sm font-mono text-red-300 whitespace-pre-wrap">
            <p className="text-red-400 font-semibold mb-1">{submissionResult.status}</p>
            {submissionResult.errorMessage}
          </div>
        )}

        <Tabs defaultValue={tabs[0]?.key}>
          <TabsList>
            {tabs.map(tab => (
              <TabsTrigger  key={tab.key} value={tab.key} className="flex items-center gap-1">
                {tab.label}
                {tab.loading && <span className="text-amber-600 text-xs animate-pulse">…</span>}
                {!tab.loading && tab.result?.status === 'PASSED' && <span className="text-emerald-400 text-xs">✓</span>}
                {!tab.loading && tab.result && tab.result.status !== 'PASSED' && <span className="text-red-400 text-xs">✗</span>}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key}>
              <div className="p-3 space-y-3">
                {tab.loading ? (
                  <p className="text-amber-400 text-sm animate-pulse">Judging your solution...</p>
                ) : tab.result ? (
                  <>
                    <div className={`text-sm font-semibold ${tab.result.status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tab.result.status === 'PASSED' ? '✅ Passed' : `❌ ${tab.result.status}`}
                      <span className="text-zinc-500 font-normal ml-2">{tab.result.timeUsed}ms</span>
                    </div>
                    {tab.tc ? (
                      <>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1.5 font-medium">Input</p>
                          <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm font-mono whitespace-pre-wrap text-zinc-300">{tab.tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1.5 font-medium">Expected Output</p>
                          <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm font-mono text-zinc-300">{tab.tc.expectedOutput}</pre>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-zinc-600 italic">Hidden test case — input and output are not shown.</p>
                    )}
                  </>
                ) : null}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  // ── Run mode ───────────────────────────────────────────────────────────────
  if (testCases.length === 0) {
    return (
      <div className="w-full p-4 text-zinc-400 text-sm">
        {isRunning ? (
          <span className="text-amber-400 animate-pulse">Running...</span>
        ) : (
          'No visible test cases.'
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-950 p-4 h-full overflow-y-auto">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold">Test Cases</p>
        {isRunning && (
          <span className="text-amber-400 text-sm animate-pulse">Running...</span>
        )}
        {!isRunning && runResult && (
          <div className="flex items-center gap-3 text-sm">
            <span className={runResult.status === 'ACCEPTED' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {runResult.status}
            </span>
            {runResult.status === 'ACCEPTED' && (
              <>
                <span className="text-zinc-400">{runResult.passed}/{runResult.total} passed</span>
                <span className="text-zinc-400">{runResult.timeUsed}ms</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Compile / runtime error block */}
      {!isRunning && runResult && runResult.status !== 'ACCEPTED' && (
        <div className="bg-red-900/40 border border-red-600 rounded-lg p-3 mb-3 text-sm font-mono text-red-300 whitespace-pre-wrap">
          <p className="text-red-400 font-semibold mb-1">{runResult.status}</p>
          {runResult.errorMessage ?? runResult.runtimeError ?? 'An error occurred while running your code.'}
        </div>
      )}

      <Tabs defaultValue={testCases[0]?.id}>
        <TabsList>
          {testCases.map((tc, idx) => {
            const result = runResult?.results.find(r => r.testCaseId === tc.id);
            return (
              <TabsTrigger value={tc.id} key={tc.id} className="flex items-center gap-1">
                Case {idx + 1}
                {result?.status === 'PASSED' && <span className="text-emerald-400 text-xs">✓</span>}
                {result && result.status !== 'PASSED' && <span className="text-red-400 text-xs">✗</span>}
                {isRunning && !result && <span className="text-amber-400 text-xs animate-pulse">…</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {testCases.map((tc) => {
          const result = runResult?.results.find(r => r.testCaseId === tc.id);
          return (
            <TabsContent value={tc.id} key={tc.id}>
              <div className="p-3 space-y-3">
                {result && (
                  <div className={`text-sm font-semibold ${result.status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.status === 'PASSED' ? '✅ Passed' : `❌ ${result.status}`}
                    <span className="text-zinc-500 font-normal ml-2">{result.timeUsed}ms</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5 font-medium">Input</p>
                  <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm font-mono whitespace-pre-wrap text-zinc-300">{tc.input}</pre>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5 font-medium">Expected Output</p>
                  <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm font-mono text-zinc-300">{tc.expectedOutput}</pre>
                </div>
                {result && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5 font-medium">Your Output</p>
                    <pre className={`p-3 rounded-lg text-sm font-mono ${result.status === 'PASSED' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                      {result.actualOutput}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
