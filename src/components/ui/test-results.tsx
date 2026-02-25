// @ts-nocheck
//@ts-ignore
import { Card, CardContent } from "./card";
import { CheckCircle, XCircle, Loader, AlertCircle } from "lucide-react";

export interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
}

interface TestResultsProps {
  results: TestResult[];
  isLoading?: boolean;
  totalTime?: number;
  totalMemory?: number;
  compilationError?: string;
}

export function TestResults({
  results,
  isLoading,
  totalTime,
  totalMemory,
  compilationError,
}: TestResultsProps) {
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <Loader className="animate-spin text-blue-400" size={32} />
        <p className="text-zinc-400">Running test cases...</p>
      </div>
    );
  }

  // Show compilation error if present
  if (compilationError) {
    return (
      <div className="p-6">
        <Card className="bg-orange-900/30 border-orange-700 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-400 mb-2">
                  Compilation Error
                </h3>
                <pre className="bg-zinc-800 p-3 rounded text-xs font-mono text-zinc-100 overflow-x-auto border border-zinc-700">
                  {compilationError}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-zinc-400 text-sm p-6">
        Click "Run" to test your code against the test cases.
      </p>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {passedCount}/{totalCount} Passed
          </span>
          {passedCount === totalCount && (
            <span className="text-xs px-2 py-1 bg-green-900/50 text-green-300 rounded-full">
              All tests passed! ✓
            </span>
          )}
        </div>
        {totalTime !== undefined && (
          <span className="text-zinc-400 text-sm">
            Time: {totalTime.toFixed(0)}ms
          </span>
        )}
        {totalMemory !== undefined && (
          <span className="text-zinc-400 text-sm">
            Memory: {(totalMemory / 1024 / 1024).toFixed(2)}MB
          </span>
        )}
      </div>

      {/* Test Cases */}
      {results.map((result, index) => (
        <Card key={index} className="bg-zinc-900 border-zinc-800 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              {result.passed ? (
                <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-1" />
              ) : (
                <XCircle size={20} className="text-red-500 flex-shrink-0 mt-1" />
              )}
              <span className="font-semibold">
                Test Case {index + 1}{" "}
                {result.passed ? (
                  <span className="text-green-500">Passed</span>
                ) : (
                  <span className="text-red-500">Failed</span>
                )}
              </span>
            </div>

            <div className="space-y-2 text-sm font-mono">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Input:</p>
                <pre className="bg-zinc-800 p-2 rounded overflow-x-auto text-zinc-100">
                  {result.input}
                </pre>
              </div>

              <div>
                <p className="text-zinc-500 text-xs mb-1">Expected Output:</p>
                <pre className="bg-zinc-800 p-2 rounded overflow-x-auto text-zinc-100">
                  {result.expectedOutput}
                </pre>
              </div>

              {result.actualOutput && (
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Actual Output:</p>
                  <pre className={`bg-zinc-800 p-2 rounded overflow-x-auto ${result.passed ? "text-green-300" : "text-red-300"}`}>
                    {result.actualOutput}
                  </pre>
                </div>
              )}

              {result.error && (
                <div>
                  <p className="text-red-400 text-xs mb-1">Runtime Error:</p>
                  <pre className="bg-red-950 p-2 rounded overflow-x-auto text-red-300 text-xs">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
