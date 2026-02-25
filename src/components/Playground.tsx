// @ts-nocheck
//@ts-ignore
import { useEffect, useState } from 'react'
import { IoIosFlask, IoIosTimer } from 'react-icons/io'
import { MdOutlineDescription } from 'react-icons/md'
import { SiTicktick } from 'react-icons/si'
import Editor from "@monaco-editor/react";
import { FaPlay, FaCheck } from "react-icons/fa";
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compileRun, fetchSubmissions, HARDCODED_USER_ID, type ApiTestCase, type Question, type RunResult, type SubmissionResult, type SubmissionSummary, type SubmissionTestResult } from '@/lib/editor.action'

// ─── SubmissionsList ──────────────────────────────────────────────────────────

function SubmissionsList({ questionId }: { questionId: string }) {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions(questionId, HARDCODED_USER_ID)
      .then(data => { setSubmissions(data); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [questionId]);

  if (loading) return <p className="text-gray-400 text-sm animate-pulse">Loading submissions...</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (submissions.length === 0) return <p className="text-gray-400 text-sm">No submissions yet.</p>;

  const statusColor = (s: string) =>
    s === 'ACCEPTED' ? 'text-green-400' :
    s === 'PENDING' || s === 'RUNNING' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-2">
      {submissions.map(sub => (
        <div key={sub.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${statusColor(sub.status)}`}>
              {sub.status.replace(/_/g, ' ')}
            </span>
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300 uppercase">
              {sub.language}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {sub.score > 0 && <span>{sub.score} pts</span>}
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
  'data-[state=active]:bg-transparent text-gray-400 py-4 px-1';

interface DescriptionUiProps {
  question: Question | null;
  submissionsRefreshKey?: number;
}

export const DescriptionUi = ({ question, submissionsRefreshKey = 0 }: DescriptionUiProps) => {
  if (!question) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  const difficultyColor =
    question.difficulty === 'EASY' ? 'text-green-400' :
    question.difficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue="description" className="flex flex-col h-full">
        {/* Tab headers */}
        <TabsList className="w-full justify-start rounded-none border-b border-gray-700 bg-transparent px-6 h-auto py-0 gap-4">
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
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xl font-bold">{question.title}</p>
            <span className={`text-sm font-medium ${difficultyColor}`}>
              {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
            </span>
            {question.topic && (
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                {question.topic}
              </span>
            )}
          </div>
          <div className="flex gap-4 text-xs text-gray-400 mb-4">
            <span>⏱ {question.timeLimit}ms</span>
            <span>💾 {question.memoryLimit}MB</span>
            {question.totalSubmissions > 0 && (
              <span className="flex items-center gap-1">
                <SiTicktick className="text-green-400" />
                {((question.acceptedSubmissions / question.totalSubmissions) * 100).toFixed(1)}% acceptance
              </span>
            )}
          </div>
           
          <p className="leading-relaxed whitespace-pre-wrap mb-6">{question.description}</p>
           <p className="text-lg font-semibold text-blue-400 mb-2">Input Format:</p>

          <p className="leading-relaxed whitespace-pre-wrap mb-6">{question.inputFormat}</p>
           <p className="text-lg font-semibold text-blue-400 mb-2">Output Format:</p>

          <p className="leading-relaxed whitespace-pre-wrap mb-6">{question.outputFormat}</p>

          {question.testCases.length > 0 && (
            <div className="mb-4">
              <p className="text-lg font-semibold text-blue-400 mb-2">Examples:</p>
              {question.testCases.map((tc, idx) => (
                <div key={tc.id} className="bg-gray-800 p-4 rounded-lg mb-3 font-mono text-sm">
                  <p className="text-gray-400 mb-1">Example {idx + 1}:</p>
                  <p><span className="text-yellow-400 font-semibold">Input: </span>{tc.input}</p>
                  <p><span className="text-green-400 font-semibold">Output: </span>{tc.expectedOutput}</p>
                </div>
              ))}
            </div>
          )}
           <p className="text-lg font-semibold text-blue-400 mb-2">Constraints:</p>
           <p className="leading-relaxed whitespace-pre-wrap mb-6">{question.constraints}</p>
        </TabsContent>

        {/* Solution */}
        <TabsContent value="solution" className="flex-1 overflow-y-auto p-6 mt-0">
          <p className="text-gray-400 text-sm">Solution not available yet.</p>
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
  java: "// Write your solution here\npublic class Solution {\n    public void solve() {\n        \n    }\n}",
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
    compileRun(
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
    <div className="w-full h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
        <h2 className="text-lg font-semibold">&lt;/&gt; Code</h2>
        <div className="flex gap-3 items-center">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-transparent border border-gray-600 rounded px-2 py-1 text-sm"
            disabled={busy}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
          <Button
            className="bg-green-600 flex items-center gap-2 min-w-[90px]"
            onClick={runCode}
            disabled={!question || busy}
          >
            {isRunning ? (
              <>
                <span className="animate-spin inline-block">⟳</span> Running...
              </>
            ) : (
              <>
                <FaPlay /> Run
              </>
            )}
          </Button>
          <Button
            className="bg-blue-600 flex items-center gap-2 min-w-25"
            onClick={() => { if (!question || busy) return; onSubmit(language, code); }}
            disabled={!question || busy}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin inline-block">⟳</span> Submitting...
              </>
            ) : (
              <>
                <FaCheck /> Submit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 rounded-lg overflow-hidden border border-gray-700">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value ?? '')}
          options={{ minimap: { enabled: false } }}
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
      <div className="w-full bg-black p-4 h-full overflow-y-auto">
        {/* Summary bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold">Test Cases</p>
          {isSubmitting ? (
            <span className="text-yellow-400 text-sm animate-pulse">
              Judging...{totalSubmissionCount > 0 ? ` ${totalSubmissionCount} test cases` : ''}
            </span>
          ) : submissionResult && (
            <div className="flex items-center gap-3 text-sm">
              <span className={submissionResult.status === 'ACCEPTED' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                {submissionResult.status}
              </span>
              <span className="text-gray-400">{passedCount}/{totalCount} passed</span>
              <span className="text-gray-400">{submissionResult.timeUsed}ms</span>
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
                {tab.loading && <span className="text-yellow-800 text-xs animate-pulse">…</span>}
                {!tab.loading && tab.result?.status === 'PASSED' && <span className="text-green-400 text-xs">✓</span>}
                {!tab.loading && tab.result && tab.result.status !== 'PASSED' && <span className="text-red-400 text-xs">✗</span>}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key}>
              <div className="p-3 space-y-3">
                {tab.loading ? (
                  <p className="text-yellow-400 text-sm animate-pulse">Judging your solution...</p>
                ) : tab.result ? (
                  <>
                    <div className={`text-sm font-semibold ${tab.result.status === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
                      {tab.result.status === 'PASSED' ? '✅ Passed' : `❌ ${tab.result.status}`}
                      <span className="text-gray-400 font-normal ml-2">{tab.result.timeUsed}ms</span>
                    </div>
                    {tab.tc ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Input</p>
                          <pre className="bg-gray-800 p-3 rounded-lg text-sm font-mono whitespace-pre-wrap">{tab.tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Expected Output</p>
                          <pre className="bg-gray-800 p-3 rounded-lg text-sm font-mono">{tab.tc.expectedOutput}</pre>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Hidden test case — input and output are not shown.</p>
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
      <div className="w-full p-4 text-gray-400 text-sm">
        {isRunning ? (
          <span className="text-yellow-400 animate-pulse">Running...</span>
        ) : (
          'No visible test cases.'
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-black p-4 h-full overflow-y-auto">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold">Test Cases</p>
        {isRunning && (
          <span className="text-yellow-400 text-sm animate-pulse">Running...</span>
        )}
        {!isRunning && runResult && (
          <div className="flex items-center gap-3 text-sm">
            <span className={runResult.status === 'ACCEPTED' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {runResult.status}
            </span>
            {runResult.status === 'ACCEPTED' && (
              <>
                <span className="text-gray-400">{runResult.passed}/{runResult.total} passed</span>
                <span className="text-gray-400">{runResult.timeUsed}ms</span>
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
                {result?.status === 'PASSED' && <span className="text-green-400 text-xs">✓</span>}
                {result && result.status !== 'PASSED' && <span className="text-red-400 text-xs">✗</span>}
                {isRunning && !result && <span className="text-yellow-400 text-xs animate-pulse">…</span>}
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
                  <div className={`text-sm font-semibold ${result.status === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
                    {result.status === 'PASSED' ? '✅ Passed' : `❌ ${result.status}`}
                    <span className="text-gray-400 font-normal ml-2">{result.timeUsed}ms</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-1">Input</p>
                  <pre className="bg-gray-800 p-3 rounded-lg text-sm font-mono whitespace-pre-wrap">{tc.input}</pre>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Expected Output</p>
                  <pre className="bg-gray-800 p-3 rounded-lg text-sm font-mono">{tc.expectedOutput}</pre>
                </div>
                {result && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Your Output</p>
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
