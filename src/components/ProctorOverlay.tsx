// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { createProctorMonitor, type ProctorMonitor, type ProctorEventType } from '@/lib/proctor';

interface ProctorOverlayProps {
  isProctored: boolean;
  testAttemptId: string;
  maxViolations: number;
  onAutoSubmit: () => void;
  children: React.ReactNode;
}

export default function ProctorOverlay({ isProctored, testAttemptId, maxViolations, onAutoSubmit, children }: ProctorOverlayProps) {
  const monitorRef = useRef<ProctorMonitor | null>(null);
  const [violations, setViolations] = useState(0);
  const [remaining, setRemaining] = useState(maxViolations);
  const [showWarning, setShowWarning] = useState(false);
  const [showScreenSharePrompt, setShowScreenSharePrompt] = useState(false);

  const startMonitor = () => {
    if (monitorRef.current) return;

    const monitor = createProctorMonitor({
      testAttemptId,
      maxViolations,
      onViolation: (type: ProctorEventType, violationCount: number, rem: number) => {
        setViolations(violationCount);
        setRemaining(rem);
        setShowWarning(true);
      },
      onAutoSubmit: () => {
        // Stop proctor (kills stream + exits fullscreen) before submitting
        monitor.stop();
        monitorRef.current = null;
        onAutoSubmit();
      },
      onScreenShareRejected: () => {
        // User selected a tab/window instead of entire screen
        monitorRef.current = null;
        setShowScreenSharePrompt(true);
      },
    });

    monitor.start();
    monitorRef.current = monitor;
  };

  useEffect(() => {
    if (!isProctored || !testAttemptId) return;

    startMonitor();

    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
        monitorRef.current = null;
      }
    };
  }, [isProctored, testAttemptId, maxViolations]);

  // Auto-dismiss warning when fullscreen is re-entered
  useEffect(() => {
    if (!showWarning) return;

    const handleFsChange = () => {
      if (document.fullscreenElement) {
        setShowWarning(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [showWarning]);

  const handleRetryScreenShare = () => {
    setShowScreenSharePrompt(false);
    startMonitor();
  };

  if (!isProctored) return <>{children}</>;

  return (
    <div className="relative">
      {children}

      {/* Proctor indicator badge - top right, below the top bar */}
      <div className="fixed top-16 right-4 z-50 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-zinc-400 font-medium">Proctored</span>
          {violations > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
              {violations}/{maxViolations}
            </span>
          )}
        </div>
      </div>

      {/* Screen share rejection — must share entire screen */}
      {showScreenSharePrompt && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Entire Screen Required</h2>
            <p className="text-sm text-zinc-400 mb-6">
              You must share your <span className="text-amber-400 font-semibold">entire screen</span> for proctoring.
              Sharing a single tab or window is not allowed. Please select "Entire Screen" when prompted.
            </p>

            <button
              onClick={handleRetryScreenShare}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all cursor-pointer"
            >
              Share Entire Screen
            </button>
          </div>
        </div>
      )}

      {/* Warning overlay on fullscreen violation */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            {/* Red warning icon */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Fullscreen Violation Detected</h2>
            <p className="text-sm text-zinc-400 mb-6">
              You have <span className="text-red-400 font-semibold">{remaining}</span> attempt(s) remaining before auto-submission.
            </p>

            <button
              onClick={() => {
                document.documentElement.requestFullscreen().catch(() => {});
              }}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all cursor-pointer"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
