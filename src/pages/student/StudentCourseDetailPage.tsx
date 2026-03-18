// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE, authFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ContentItem {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF';
  url: string;
  duration: number | null;
}

interface CourseDay {
  id: string;
  dayNumber: number;
  title: string;
  contents?: ContentItem[];
}

interface CourseProgress {
  completedDayNum: number;
  course: {
    id: string;
    title: string;
    description: string | null;
    totalDays: number;
    days: CourseDay[];
  };
}

export default function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayContents, setDayContents] = useState<Record<number, ContentItem[]>>({});
  const [loadingDay, setLoadingDay] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/course-progress/${courseId}`);
      if (!res.ok) throw new Error('Failed to load course progress');
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    }
  }, [courseId]);

  useEffect(() => {
    fetchProgress().finally(() => setLoading(false));
  }, [fetchProgress]);

  const fetchDayContent = async (dayNum: number) => {
    if (dayContents[dayNum]) return; // already loaded
    setLoadingDay(dayNum);
    try {
      const res = await authFetch(`${API_BASE}/course-progress/${courseId}/day/${dayNum}`);
      if (res.ok) {
        const data = await res.json();
        setDayContents((prev) => ({ ...prev, [dayNum]: data.contents ?? data ?? [] }));
      } else if (res.status === 403) {
        // Day is locked, do nothing
      }
    } catch { /* ignore */ }
    setLoadingDay(null);
  };

  const handleCompleteDay = async () => {
    if (!courseId) return;
    setCompleting(true);
    try {
      const res = await authFetch(`${API_BASE}/course-progress/${courseId}/complete-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to complete day');
      await fetchProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete day');
    } finally {
      setCompleting(false);
    }
  };

  const getDayStatus = (dayNum: number) => {
    if (!progress) return 'locked';
    if (dayNum <= progress.completedDayNum) return 'completed';
    if (dayNum === progress.completedDayNum + 1) return 'current';
    return 'locked';
  };

  const handleAccordionChange = (values: string[]) => {
    // Fetch content for newly opened days
    values.forEach((v) => {
      const dayNum = Number(v);
      if (!isNaN(dayNum)) {
        const status = getDayStatus(dayNum);
        if (status !== 'locked') {
          fetchDayContent(dayNum);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-zinc-400">Loading course...</div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-400">{error || 'Course not found'}</p>
        </div>
      </div>
    );
  }

  const { course } = progress;
  const total = course.totalDays || 1;
  const completed = progress.completedDayNum || 0;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-zinc-400 text-sm mb-4">{course.description}</p>
          )}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-300 text-sm font-medium">Course Progress</span>
              <span className="text-zinc-400 text-sm">
                {completed}/{total} days completed ({percent}%)
              </span>
            </div>
            <Progress value={percent} className="h-3 bg-zinc-800" />
          </div>
        </div>

        {/* Days List */}
        <Accordion type="multiple" onValueChange={handleAccordionChange} className="space-y-3">
          {(course.days ?? [])
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((day) => {
              const status = getDayStatus(day.dayNumber);
              const isLocked = status === 'locked';
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';

              return (
                <AccordionItem
                  key={day.dayNumber}
                  value={String(day.dayNumber)}
                  className={`border rounded-xl px-5 ${
                    isLocked
                      ? 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
                      : isCompleted
                        ? 'bg-zinc-900 border-green-500/20'
                        : 'bg-zinc-900 border-blue-500/20'
                  }`}
                  disabled={isLocked}
                >
                  <AccordionTrigger
                    className={`hover:no-underline ${isLocked ? 'cursor-not-allowed' : ''}`}
                    disabled={isLocked}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {isCompleted && (
                          <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {isCurrent && (
                          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            </svg>
                          </div>
                        )}
                        {isLocked && (
                          <div className="w-7 h-7 rounded-full bg-zinc-700/50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <span className={`font-medium ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
                        Day {day.dayNumber}: {day.title}
                      </span>

                      {isCompleted && (
                        <Badge className="ml-auto mr-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Completed
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge className="ml-auto mr-2 bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>

                  {!isLocked && (
                    <AccordionContent className="pt-2 pb-4">
                      {loadingDay === day.dayNumber ? (
                        <div className="text-center py-4 text-zinc-400 text-sm">Loading content...</div>
                      ) : dayContents[day.dayNumber] && dayContents[day.dayNumber].length > 0 ? (
                        <div className="space-y-2">
                          {dayContents[day.dayNumber].map((content) => (
                            <a
                              key={content.id}
                              href={content.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                            >
                              {/* Type Icon */}
                              {content.type === 'VIDEO' ? (
                                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                                  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-white text-sm font-medium truncate">{content.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge className={`text-xs ${content.type === 'VIDEO' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                                    {content.type}
                                  </Badge>
                                  {content.duration && (
                                    <span className="text-zinc-500 text-xs">{content.duration} min</span>
                                  )}
                                </div>
                              </div>
                              <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      ) : dayContents[day.dayNumber] ? (
                        <p className="text-zinc-500 text-sm text-center py-4">No content available for this day.</p>
                      ) : (
                        <p className="text-zinc-500 text-sm text-center py-4">Expand to load content.</p>
                      )}

                      {/* Mark Complete Button */}
                      {isCurrent && (
                        <div className="mt-4 pt-3 border-t border-zinc-700">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteDay();
                            }}
                            disabled={completing}
                            className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
                          >
                            {completing ? 'Marking Complete...' : 'Mark Day Complete'}
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  )}
                </AccordionItem>
              );
            })}
        </Accordion>
      </div>
    </div>
  );
}
