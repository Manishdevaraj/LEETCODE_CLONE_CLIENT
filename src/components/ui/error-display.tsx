// @ts-nocheck
//@ts-ignore
import React from "react";
import { Card, CardContent } from "./card";
import { AlertCircle, Code2, Zap, AlertTriangle } from "lucide-react";

export interface ExecutionError {
  type: "SYNTAX_ERROR" | "COMPILE_ERROR" | "RUNTIME_ERROR" | "TIMEOUT_ERROR" | "MEMORY_ERROR";
  message: string;
  details?: string;
  lineNumber?: number;
  timestamp?: number;
}

interface ErrorDisplayProps {
  errors: ExecutionError[];
  isLoading?: boolean;
}

const errorConfig = {
  SYNTAX_ERROR: {
    icon: Code2,
    title: "Syntax Error",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
    borderColor: "border-yellow-700",
  },
  COMPILE_ERROR: {
    icon: AlertTriangle,
    title: "Compilation Error",
    color: "text-orange-400",
    bgColor: "bg-orange-900/30",
    borderColor: "border-orange-700",
  },
  RUNTIME_ERROR: {
    icon: Zap,
    title: "Runtime Error",
    color: "text-red-400",
    bgColor: "bg-red-900/30",
    borderColor: "border-red-700",
  },
  TIMEOUT_ERROR: {
    icon: AlertCircle,
    title: "Time Limit Exceeded",
    color: "text-purple-400",
    bgColor: "bg-purple-900/30",
    borderColor: "border-purple-700",
  },
  MEMORY_ERROR: {
    icon: AlertCircle,
    title: "Memory Limit Exceeded",
    color: "text-blue-400",
    bgColor: "bg-blue-900/30",
    borderColor: "border-blue-700",
  },
};

export function ErrorDisplay({ errors, isLoading }: ErrorDisplayProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {errors.map((error, index) => {
        const config = errorConfig[error.type];
        const IconComponent = config.icon;

        return (
          <Card
            key={index}
            className={`${config.bgColor} border ${config.borderColor} rounded-lg`}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <IconComponent
                  size={24}
                  className={`${config.color} flex-shrink-0 mt-0.5`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${config.color}`}>
                      {config.title}
                    </h3>
                    {error.lineNumber && (
                      <span className="text-xs text-zinc-400">
                        Line {error.lineNumber}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-200 mb-2">
                    {error.message}
                  </p>

                  {error.details && (
                    <pre className="bg-zinc-800/50 p-3 rounded text-xs font-mono text-zinc-300 overflow-x-auto border border-zinc-700">
                      {error.details}
                    </pre>
                  )}

                  {error.timestamp && (
                    <p className="text-xs text-zinc-500 mt-2">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
