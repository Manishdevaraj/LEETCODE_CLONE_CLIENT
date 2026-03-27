import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseProgressService } from '@/services/course-progress.service';
import { useCourseProgressStore } from '@/stores/courseProgressStore';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type {
  CourseDay,
  CourseSubModule,
  ContentItem,
  DayProgressBreakdown,
} from '@/types/course.types';

export default function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentProgress, isLoading, error, fetchCourseProgress, markContentComplete, clearError } =
    useCourseProgressStore();

  // Lazy-loaded day content keyed by dayNumber
  const [dayContent, setDayContent] = useState<Record<number, CourseDay>>({});
  const [loadingDay, setLoadingDay] = useState<number | null>(null);
  const [completingContent, setCompletingContent] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseProgress(courseId);
    }
    return () => clearError();
  }, [courseId, fetchCourseProgress, clearError]);

  const fetchDayContent = useCallback(
    async (dayNum: number) => {
      if (dayContent[dayNum] || !courseId) return;
      setLoadingDay(dayNum);
      try {
        const data = await courseProgressService.getDayContent(courseId, dayNum);
        setDayContent((prev) => ({ ...prev, [dayNum]: data }));
      } catch {
        // Day may be locked — silently ignore
      }
      setLoadingDay(null);
    },
    [courseId, dayContent],
  );

  const handleAccordionChange = (values: string[]) => {
    values.forEach((v) => {
      const dayNum = Number(v);
      if (!isNaN(dayNum)) {
        const dayBreakdown = currentProgress?.days.find((d) => d.dayNumber === dayNum);
        if (dayBreakdown && !dayBreakdown.locked) {
          fetchDayContent(dayNum);
        }
      }
    });
  };

  const handleContentComplete = async (contentId: string) => {
    if (!courseId || completingContent) return;
    setCompletingContent(contentId);
    try {
      await markContentComplete(courseId, contentId);
      // Also update the local day content to reflect completion
      setDayContent((prev) => {
        const updated = { ...prev };
        for (const dayNum of Object.keys(updated)) {
          const day = updated[Number(dayNum)];
          if (day.subModules) {
            for (const sm of day.subModules) {
              if (sm.contents) {
                const item = sm.contents.find((c) => c.id === contentId);
                if (item) item.isCompleted = true;
              }
            }
          }
        }
        return updated;
      });
    } finally {
      setCompletingContent(null);
    }
  };

  if (isLoading && !currentProgress) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-zinc-400">Loading course...</div>
      </div>
    );
  }

  if (error || !currentProgress) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-400">{error || 'Course not found'}</p>
        </div>
      </div>
    );
  }

  const { title, description, totalDays, completedDayNum, percentage, days } = currentProgress;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          {description && (
            <p className="text-zinc-400 text-sm mb-4">{description}</p>
          )}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-300 text-sm font-medium">Course Progress</span>
              <span className="text-zinc-400 text-sm">
                {completedDayNum}/{totalDays} days completed ({percentage}%)
              </span>
            </div>
            <Progress value={percentage} className="h-3 bg-zinc-800" />
          </div>
        </div>

        {/* Days List */}
        <Accordion type="multiple" onValueChange={handleAccordionChange} className="space-y-3">
          {[...days]
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((day) => (
              <DayAccordionItem
                key={day.dayNumber}
                day={day}
                courseId={courseId!}
                dayData={dayContent[day.dayNumber] ?? null}
                loadingDay={loadingDay}
                completingContent={completingContent}
                onContentComplete={handleContentComplete}
                onNavigatePractice={(dayNum, subModuleId) =>
                  navigate(`/student/courses/${courseId}/day/${dayNum}/practice/${subModuleId}`)
                }
              />
            ))}
        </Accordion>
      </div>
    </div>
  );
}

/* ─── Day Accordion Item ─── */

interface DayAccordionItemProps {
  day: DayProgressBreakdown;
  courseId: string;
  dayData: CourseDay | null;
  loadingDay: number | null;
  completingContent: string | null;
  onContentComplete: (contentId: string) => void;
  onNavigatePractice: (dayNum: number, subModuleId: string) => void;
}

function DayAccordionItem({
  day,
  dayData,
  loadingDay,
  completingContent,
  onContentComplete,
  onNavigatePractice,
}: DayAccordionItemProps) {
  const isLocked = day.locked;
  const isCompleted = day.percentage === 100;
  const isInProgress = !isLocked && !isCompleted;

  return (
    <AccordionItem
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
            {isInProgress && (
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

          <div className="flex-1 min-w-0 text-left">
            <span className={`font-medium ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
              Day {day.dayNumber}: {day.title}
            </span>
            {!isLocked && (
              <div className="flex items-center gap-2 mt-1">
                <Progress value={day.percentage} className="h-1.5 bg-zinc-800 flex-1 max-w-[120px]" />
                <span className="text-zinc-500 text-xs">
                  {day.completedItems}/{day.totalItems}
                </span>
              </div>
            )}
          </div>

          {isCompleted && (
            <Badge className="ml-auto mr-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              Completed
            </Badge>
          )}
          {isInProgress && day.completedItems > 0 && (
            <Badge className="ml-auto mr-2 bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              In Progress
            </Badge>
          )}
        </div>
      </AccordionTrigger>

      {!isLocked && (
        <AccordionContent className="pt-2 pb-4">
          {loadingDay === day.dayNumber ? (
            <div className="text-center py-4 text-zinc-400 text-sm">Loading content...</div>
          ) : dayData && dayData.subModules && dayData.subModules.length > 0 ? (
            <div className="space-y-4">
              {[...dayData.subModules]
                .sort((a, b) => a.order - b.order)
                .map((sm) => (
                  <SubModuleSection
                    key={sm.id}
                    subModule={sm}
                    dayProgress={day}
                    dayNumber={day.dayNumber}
                    completingContent={completingContent}
                    onContentComplete={onContentComplete}
                    onNavigatePractice={onNavigatePractice}
                  />
                ))}
            </div>
          ) : dayData ? (
            <p className="text-zinc-500 text-sm text-center py-4">No content available for this day.</p>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-4">Expand to load content.</p>
          )}
        </AccordionContent>
      )}
    </AccordionItem>
  );
}

/* ─── Sub-Module Section ─── */

interface SubModuleSectionProps {
  subModule: CourseSubModule;
  dayProgress: DayProgressBreakdown;
  dayNumber: number;
  completingContent: string | null;
  onContentComplete: (contentId: string) => void;
  onNavigatePractice: (dayNum: number, subModuleId: string) => void;
}

function SubModuleSection({
  subModule,
  dayProgress,
  dayNumber,
  completingContent,
  onContentComplete,
  onNavigatePractice,
}: SubModuleSectionProps) {
  const smProgress = dayProgress.subModules.find((s) => s.id === subModule.id);

  return (
    <div className="bg-zinc-800/40 rounded-lg border border-zinc-700/50 p-4">
      {/* Sub-module header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs ${
              subModule.subModuleType === 'LEARNING'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-violet-500/20 text-violet-400 border-violet-500/30'
            }`}
          >
            {subModule.subModuleType === 'LEARNING' ? 'Learning' : 'Practice'}
          </Badge>
          <span className="text-white text-sm font-medium">{subModule.title}</span>
        </div>
        {smProgress && (
          <span className="text-zinc-500 text-xs">
            {smProgress.completedItems}/{smProgress.totalItems} ({smProgress.percentage}%)
          </span>
        )}
      </div>

      {/* Sub-module progress bar */}
      {smProgress && smProgress.totalItems > 0 && (
        <Progress value={smProgress.percentage} className="h-1.5 bg-zinc-700 mb-3" />
      )}

      {/* LEARNING sub-module: content items with checkboxes */}
      {subModule.subModuleType === 'LEARNING' && subModule.contents && (
        <div className="space-y-2">
          {[...subModule.contents]
            .sort((a, b) => a.order - b.order)
            .map((content) => (
              <ContentItemRow
                key={content.id}
                content={content}
                isCompleting={completingContent === content.id}
                onComplete={onContentComplete}
              />
            ))}
        </div>
      )}

      {/* PRACTICE sub-module: question summary + start button */}
      {subModule.subModuleType === 'PRACTICE' && (
        <div className="flex items-center justify-between">
          <div className="text-zinc-400 text-sm">
            {subModule.practiceQuestions?.length ?? 0} question(s)
            {subModule.practiceType && (
              <span className="text-zinc-500 ml-2">
                ({subModule.practiceType === 'MCQ_ONLY'
                  ? 'MCQ'
                  : subModule.practiceType === 'CODING_ONLY'
                    ? 'Coding'
                    : 'MCQ + Coding'})
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onNavigatePractice(dayNumber, subModule.id);
            }}
            className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white text-xs cursor-pointer"
          >
            Start Practice
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Content Item Row ─── */

interface ContentItemRowProps {
  content: ContentItem;
  isCompleting: boolean;
  onComplete: (contentId: string) => void;
}

function ContentItemRow({ content, isCompleting, onComplete }: ContentItemRowProps) {
  return (
    <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 hover:bg-zinc-800 transition-colors">
      {/* Completion checkbox */}
      <Checkbox
        checked={content.isCompleted ?? false}
        disabled={content.isCompleted || isCompleting}
        onCheckedChange={() => {
          if (!content.isCompleted) onComplete(content.id);
        }}
        className="border-zinc-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
      />

      {/* Content link */}
      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* Type Icon */}
        {content.contentType === 'VIDEO' ? (
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${content.isCompleted ? 'text-zinc-500 line-through' : 'text-white'}`}>
            {content.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              className={`text-xs ${
                content.contentType === 'VIDEO'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}
            >
              {content.contentType}
            </Badge>
            {content.durationMins && (
              <span className="text-zinc-500 text-xs">{content.durationMins} min</span>
            )}
          </div>
        </div>
        <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
