import { useState, useEffect } from 'react';
import { courseService } from '@/services/course.service';
import { batchService } from '@/services/batch.service';
import { mcqService } from '@/services/mcq.service';
import { questionService } from '@/services/question.service';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import type {
  Course,
  CourseDetail,
  CourseDay,
  CourseSubModule,
  ContentItem,
  PracticeQuestionItem,
  CourseBatch,
  CourseCreatePayload,
  CourseUpdatePayload,
  CourseDayPayload,
  CreateSubModulePayload,
  UpdateSubModulePayload,
  CourseContentPayload,
  AddPracticeQuestionPayload,
  CourseBatchAssignPayload,
} from '@/types/course.types';
import type { McqQuestion } from '@/types/mcq.types';
import type { QuestionSummary } from '@/types/question.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Batch {
  id: string;
  name: string;
}

/** Convert ISO string to datetime-local input value */
const toDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Format ISO date for display in the table */
const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const fmtDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString();
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseManagementPage() {
  // ─── Data ───────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Sheet ──────────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // ─── Basic info ─────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('DRAFT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── Days ───────────────────────────────────────────────────────────────
  const [days, setDays] = useState<CourseDay[]>([]);

  // ─── Day dialog ─────────────────────────────────────────────────────────
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [editDay, setEditDay] = useState<CourseDay | null>(null);
  const [dayTitle, setDayTitle] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [dayUnlockDate, setDayUnlockDate] = useState('');
  const [daySaving, setDaySaving] = useState(false);

  // ─── Sub-module dialog ──────────────────────────────────────────────────
  const [subModuleDialogOpen, setSubModuleDialogOpen] = useState(false);
  const [subModuleDayId, setSubModuleDayId] = useState<string | null>(null);
  const [editSubModule, setEditSubModule] = useState<CourseSubModule | null>(null);
  const [smTitle, setSmTitle] = useState('');
  const [smType, setSmType] = useState<'LEARNING' | 'PRACTICE'>('LEARNING');
  const [smPracticeType, setSmPracticeType] = useState<'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED'>('MCQ_ONLY');
  const [smSaving, setSmSaving] = useState(false);

  // ─── Content dialog ─────────────────────────────────────────────────────
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [contentSubModuleId, setContentSubModuleId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<ContentItem | null>(null);
  const [contentTitle, setContentTitle] = useState('');
  const [contentType, setContentType] = useState<'VIDEO' | 'PDF'>('VIDEO');
  const [contentUrl, setContentUrl] = useState('');
  const [contentDuration, setContentDuration] = useState('');
  const [contentOrder, setContentOrder] = useState('');
  const [contentSaving, setContentSaving] = useState(false);

  // ─── Practice question picker dialog ────────────────────────────────────
  const [pqDialogOpen, setPqDialogOpen] = useState(false);
  const [pqSubModuleId, setPqSubModuleId] = useState<string | null>(null);
  const [pqTab, setPqTab] = useState<'mcq' | 'dsa'>('mcq');
  const [mcqQuestions, setMcqQuestions] = useState<McqQuestion[]>([]);
  const [dsaQuestions, setDsaQuestions] = useState<QuestionSummary[]>([]);
  const [mcqDifficulty, setMcqDifficulty] = useState('');
  const [dsaDifficulty, setDsaDifficulty] = useState('');
  const [selectedMcqIds, setSelectedMcqIds] = useState<Set<string>>(new Set());
  const [selectedDsaIds, setSelectedDsaIds] = useState<Set<string>>(new Set());
  const [pqLoading, setPqLoading] = useState(false);
  const [pqSaving, setPqSaving] = useState(false);

  // ─── Batches ────────────────────────────────────────────────────────────
  const [courseBatches, setCourseBatches] = useState<CourseBatch[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // ─── Delete ─────────────────────────────────────────────────────────────
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // Data fetching
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAll();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    }
  };

  const refreshCourseDetail = async (courseId: string) => {
    const detail: CourseDetail = await courseService.getById(courseId);
    setDays(detail.days ?? []);
    setCourseBatches(detail.batchAssignments ?? []);
    return detail;
  };

  useEffect(() => {
    fetchCourses().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Course CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const openCreateSheet = () => {
    setEditCourse(null);
    setTitle('');
    setDescription('');
    setStatus('DRAFT');
    setStartDate('');
    setEndDate('');
    setDays([]);
    setCourseBatches([]);
    setActiveTab('basic');
    setSheetOpen(true);
  };

  const openEditSheet = async (course: Course) => {
    setEditCourse(course);
    setTitle(course.title);
    setDescription(course.description ?? '');
    setStatus(course.status);
    setStartDate(toDateTimeLocal(course.startDate));
    setEndDate(toDateTimeLocal(course.endDate));
    setActiveTab('basic');
    setSheetOpen(true);

    try {
      await refreshCourseDetail(course.id);
    } catch {
      /* ignore */
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editCourse) {
        const payload: CourseUpdatePayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          status: status as CourseUpdatePayload['status'],
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
        };
        await courseService.update(editCourse.id, payload);
      } else {
        const payload: CourseCreatePayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
        };
        const saved = await courseService.create(payload);
        setEditCourse(saved);
        setDays(saved.days ?? []);
        setCourseBatches(saved.batchAssignments ?? []);
      }
      await fetchCourses();
      setActiveTab('days');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourse) return;
    setDeleteLoading(true);
    try {
      await courseService.delete(deleteCourse.id);
      await fetchCourses();
      setDeleteCourse(null);
      if (editCourse?.id === deleteCourse.id) {
        setSheetOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Day CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const openAddDay = () => {
    setEditDay(null);
    setDayNumber(days.length + 1);
    setDayTitle('');
    setDayUnlockDate('');
    setDayDialogOpen(true);
  };

  const openEditDay = (day: CourseDay) => {
    setEditDay(day);
    setDayNumber(day.dayNumber);
    setDayTitle(day.title);
    setDayUnlockDate(toDateTimeLocal(day.scheduledUnlockDate));
    setDayDialogOpen(true);
  };

  const handleSaveDay = async () => {
    if (!editCourse || !dayTitle.trim()) return;
    setDaySaving(true);
    try {
      const payload: CourseDayPayload = {
        title: dayTitle.trim(),
        dayNumber,
        scheduledUnlockDate: dayUnlockDate ? new Date(dayUnlockDate).toISOString() : null,
      };

      if (editDay) {
        await courseService.updateDay(editDay.id, payload);
      } else {
        await courseService.addDay(editCourse.id, payload);
      }

      await refreshCourseDetail(editCourse.id);
      await fetchCourses();
      setDayDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save day');
    } finally {
      setDaySaving(false);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!editCourse) return;
    try {
      await courseService.deleteDay(dayId);
      await refreshCourseDetail(editCourse.id);
      await fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete day');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Sub-Module CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  const openAddSubModule = (dayId: string) => {
    setSubModuleDayId(dayId);
    setEditSubModule(null);
    setSmTitle('');
    setSmType('LEARNING');
    setSmPracticeType('MCQ_ONLY');
    setSubModuleDialogOpen(true);
  };

  const openEditSubModule = (dayId: string, sm: CourseSubModule) => {
    setSubModuleDayId(dayId);
    setEditSubModule(sm);
    setSmTitle(sm.title);
    setSmType(sm.subModuleType);
    setSmPracticeType(sm.practiceType ?? 'MCQ_ONLY');
    setSubModuleDialogOpen(true);
  };

  const handleSaveSubModule = async () => {
    if (!editCourse || !subModuleDayId || !smTitle.trim()) return;
    setSmSaving(true);
    try {
      if (editSubModule) {
        const payload: UpdateSubModulePayload = {
          title: smTitle.trim(),
          subModuleType: smType,
          practiceType: smType === 'PRACTICE' ? smPracticeType : undefined,
        };
        await courseService.updateSubModule(editSubModule.id, payload);
      } else {
        const payload: CreateSubModulePayload = {
          title: smTitle.trim(),
          subModuleType: smType,
          practiceType: smType === 'PRACTICE' ? smPracticeType : undefined,
        };
        await courseService.addSubModule(subModuleDayId, payload);
      }

      await refreshCourseDetail(editCourse.id);
      setSubModuleDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sub-module');
    } finally {
      setSmSaving(false);
    }
  };

  const handleDeleteSubModule = async (subModuleId: string) => {
    if (!editCourse) return;
    try {
      await courseService.deleteSubModule(subModuleId);
      await refreshCourseDetail(editCourse.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sub-module');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Content CRUD (within LEARNING sub-modules)
  // ═══════════════════════════════════════════════════════════════════════════

  const openAddContent = (subModuleId: string) => {
    setContentSubModuleId(subModuleId);
    setEditContent(null);
    setContentTitle('');
    setContentType('VIDEO');
    setContentUrl('');
    setContentDuration('');
    setContentOrder('');
    setContentDialogOpen(true);
  };

  const openEditContent = (subModuleId: string, content: ContentItem) => {
    setContentSubModuleId(subModuleId);
    setEditContent(content);
    setContentTitle(content.title);
    setContentType(content.contentType);
    setContentUrl(content.url);
    setContentDuration(content.durationMins ? String(content.durationMins) : '');
    setContentOrder(String(content.order));
    setContentDialogOpen(true);
  };

  const handleSaveContent = async () => {
    if (!editCourse || !contentSubModuleId || !contentTitle.trim() || !contentUrl.trim()) return;
    setContentSaving(true);
    try {
      const payload: CourseContentPayload = {
        title: contentTitle.trim(),
        contentType,
        url: contentUrl.trim(),
        durationMins: contentDuration ? Number(contentDuration) : undefined,
        order: contentOrder ? Number(contentOrder) : undefined,
      };

      if (editContent) {
        await courseService.updateContent(editContent.id, payload);
      } else {
        await courseService.addContent(contentSubModuleId, payload);
      }

      await refreshCourseDetail(editCourse.id);
      setContentDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setContentSaving(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!editCourse) return;
    try {
      await courseService.deleteContent(contentId);
      await refreshCourseDetail(editCourse.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Practice Question Picker
  // ═══════════════════════════════════════════════════════════════════════════

  const openPracticeQuestionPicker = async (subModuleId: string) => {
    setPqSubModuleId(subModuleId);
    setPqTab('mcq');
    setSelectedMcqIds(new Set());
    setSelectedDsaIds(new Set());
    setMcqDifficulty('');
    setDsaDifficulty('');
    setPqDialogOpen(true);
    setPqLoading(true);
    try {
      const [mcqs, dsas] = await Promise.all([
        mcqService.getQuestions(),
        questionService.getAll(),
      ]);
      setMcqQuestions(Array.isArray(mcqs) ? mcqs : []);
      setDsaQuestions(Array.isArray(dsas) ? dsas : []);
    } catch {
      /* ignore */
    }
    setPqLoading(false);
  };

  const fetchFilteredMcq = async (difficulty: string) => {
    setMcqDifficulty(difficulty);
    setPqLoading(true);
    try {
      const data = await mcqService.getQuestions(difficulty ? { difficulty } : undefined);
      setMcqQuestions(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
    setPqLoading(false);
  };

  const fetchFilteredDsa = async (difficulty: string) => {
    setDsaDifficulty(difficulty);
    setPqLoading(true);
    try {
      const data = await questionService.getAll(difficulty ? { difficulty } : undefined);
      setDsaQuestions(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
    setPqLoading(false);
  };

  const handleAddSelectedQuestions = async () => {
    if (!editCourse || !pqSubModuleId) return;
    if (selectedMcqIds.size === 0 && selectedDsaIds.size === 0) return;
    setPqSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const mcqId of selectedMcqIds) {
        const payload: AddPracticeQuestionPayload = { mcqQuestionId: mcqId };
        promises.push(courseService.addPracticeQuestion(pqSubModuleId, payload));
      }
      for (const dsaId of selectedDsaIds) {
        const payload: AddPracticeQuestionPayload = { questionId: dsaId };
        promises.push(courseService.addPracticeQuestion(pqSubModuleId, payload));
      }
      await Promise.all(promises);
      await refreshCourseDetail(editCourse.id);
      setPqDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add questions');
    } finally {
      setPqSaving(false);
    }
  };

  const handleRemovePracticeQuestion = async (practiceQuestionId: string) => {
    if (!editCourse) return;
    try {
      await courseService.removePracticeQuestion(practiceQuestionId);
      await refreshCourseDetail(editCourse.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove question');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Batch assignment
  // ═══════════════════════════════════════════════════════════════════════════

  const openBatchDialog = async () => {
    setBatchLoading(true);
    setBatchDialogOpen(true);
    setSelectedBatchIds(new Set());
    try {
      const data = await batchService.getAll();
      setAllBatches(Array.isArray(data) ? (data as unknown as Batch[]) : []);
    } catch {
      /* ignore */
    }
    setBatchLoading(false);
  };

  const handleAssignBatches = async () => {
    if (!editCourse || selectedBatchIds.size === 0) return;
    setBatchLoading(true);
    try {
      const payload: CourseBatchAssignPayload = { batchIds: Array.from(selectedBatchIds) };
      await courseService.assignBatches(editCourse.id, payload);
      await refreshCourseDetail(editCourse.id);
      setBatchDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign batches');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleUnassignBatch = async (batchId: string) => {
    if (!editCourse) return;
    try {
      await courseService.unassignBatch(editCourse.id, batchId);
      await refreshCourseDetail(editCourse.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign batch');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Badge helpers
  // ═══════════════════════════════════════════════════════════════════════════

  const statusBadge = (s: string) => {
    switch (s) {
      case 'DRAFT':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{s}</Badge>;
      case 'PUBLISHED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{s}</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">{s}</Badge>;
      default:
        return <Badge>{s}</Badge>;
    }
  };

  const contentTypeBadge = (t: string) => {
    switch (t) {
      case 'VIDEO':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{t}</Badge>;
      case 'PDF':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{t}</Badge>;
      default:
        return <Badge>{t}</Badge>;
    }
  };

  const subModuleTypeBadge = (sm: CourseSubModule) => {
    if (sm.subModuleType === 'LEARNING') {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">LEARNING</Badge>;
    }
    const label = sm.practiceType ? `PRACTICE (${sm.practiceType.replace('_', ' ')})` : 'PRACTICE';
    return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{label}</Badge>;
  };

  const difficultyBadge = (d: string) => {
    switch (d) {
      case 'EASY':
      case 'BEGINNER':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">{d}</Badge>;
      case 'MEDIUM':
      case 'INTERMEDIATE':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">{d}</Badge>;
      case 'HARD':
      case 'ADVANCED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">{d}</Badge>;
      default:
        return <Badge className="text-xs">{d}</Badge>;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render helpers for sub-module contents
  // ═══════════════════════════════════════════════════════════════════════════

  const renderLearningContents = (sm: CourseSubModule) => {
    const contents = sm.contents ?? [];
    return (
      <>
        {contents.length > 0 ? (
          <div className="space-y-2">
            {contents
              .sort((a, b) => a.order - b.order)
              .map((content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between bg-zinc-900 rounded-lg p-3 border border-zinc-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {contentTypeBadge(content.contentType)}
                    <span className="text-white text-sm truncate">{content.title}</span>
                    {content.durationMins && (
                      <span className="text-zinc-500 text-xs">{content.durationMins} min</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      URL
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-white h-7 px-2 cursor-pointer"
                      onClick={() => openEditContent(sm.id, content)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 h-7 px-2 cursor-pointer"
                      onClick={() => handleDeleteContent(content.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm mb-1">No content added yet.</p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer"
          onClick={() => openAddContent(sm.id)}
        >
          + Add Content
        </Button>
      </>
    );
  };

  const renderPracticeQuestions = (sm: CourseSubModule) => {
    const questions = sm.practiceQuestions ?? [];
    return (
      <>
        {questions.length > 0 ? (
          <div className="space-y-2">
            {questions
              .sort((a, b) => a.order - b.order)
              .map((pq) => {
                const label = pq.mcqQuestion
                  ? pq.mcqQuestion.questionText
                  : pq.question
                    ? pq.question.title
                    : 'Unknown question';
                const difficulty = pq.mcqQuestion?.difficulty ?? pq.question?.difficulty;
                const qType = pq.mcqQuestion ? 'MCQ' : 'DSA';
                return (
                  <div
                    key={pq.id}
                    className="flex items-center justify-between bg-zinc-900 rounded-lg p-3 border border-zinc-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-xs shrink-0">
                        {qType}
                      </Badge>
                      {difficulty && difficultyBadge(difficulty)}
                      <span className="text-white text-sm truncate">{label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 h-7 px-2 cursor-pointer shrink-0"
                      onClick={() => handleRemovePracticeQuestion(pq.id)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm mb-1">No questions linked yet.</p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer"
          onClick={() => openPracticeQuestionPicker(sm.id)}
        >
          + Add Questions
        </Button>
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Course Management</h1>
            <p className="text-sm text-zinc-400 mt-1">Create and manage courses, days, sub-modules, and content.</p>
          </div>
          <Button
            onClick={openCreateSheet}
            className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
          >
            + Create Course
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-red-400 text-sm">{error}</span>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 cursor-pointer" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Loading / Empty / Table */}
        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-2">No courses found.</p>
            <p className="text-zinc-500 text-sm">Create your first course to get started.</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Title</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Days</TableHead>
                  <TableHead className="text-zinc-400">Start Date</TableHead>
                  <TableHead className="text-zinc-400">End Date</TableHead>
                  <TableHead className="text-zinc-400">Created</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-white font-medium">{course.title}</TableCell>
                    <TableCell>{statusBadge(course.status)}</TableCell>
                    <TableCell className="text-zinc-400">{course.totalDays ?? 0}</TableCell>
                    <TableCell className="text-zinc-400">{fmtDate(course.startDate)}</TableCell>
                    <TableCell className="text-zinc-400">{fmtDate(course.endDate)}</TableCell>
                    <TableCell className="text-zinc-400">{fmtDate(course.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white cursor-pointer"
                          onClick={() => openEditSheet(course)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                          onClick={() => setDeleteCourse(course)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Editor Sheet                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-zinc-900 border-zinc-800 w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">
              {editCourse ? 'Edit Course' : 'Create Course'}
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              {editCourse
                ? 'Update course details, days, sub-modules, and batch assignments.'
                : 'Fill in the basic info to create a new course.'}
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4 bg-zinc-800" />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-zinc-800 border-zinc-700 w-full">
              <TabsTrigger value="basic" className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white cursor-pointer">
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="days"
                className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white cursor-pointer"
                disabled={!editCourse}
              >
                Days & Content
              </TabsTrigger>
              <TabsTrigger
                value="batches"
                className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white cursor-pointer"
                disabled={!editCourse}
              >
                Batches
              </TabsTrigger>
            </TabsList>

            {/* ─── Basic Info Tab ─────────────────────────────────────────── */}
            <TabsContent value="basic" className="mt-4 space-y-4">
              <div>
                <Label className="text-zinc-300 mb-1.5 block">Title</Label>
                <Input
                  placeholder="Course title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 block">Description</Label>
                <Textarea
                  placeholder="Course description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 block">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="DRAFT" className="text-white">Draft</SelectItem>
                    <SelectItem value="PUBLISHED" className="text-white">Published</SelectItem>
                    <SelectItem value="ARCHIVED" className="text-white">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300 mb-1.5 block">Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-1.5 block">End Date</Label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveBasicInfo}
                disabled={saving || !title.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
              >
                {saving ? 'Saving...' : editCourse ? 'Save & Continue' : 'Create & Continue'}
              </Button>
            </TabsContent>

            {/* ─── Days & Content Tab ─────────────────────────────────────── */}
            <TabsContent value="days" className="mt-4 space-y-4">
              {days.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No days added yet. Add your first day to begin building the course.
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {days
                    .sort((a, b) => a.dayNumber - b.dayNumber)
                    .map((day) => (
                      <AccordionItem
                        key={day.id}
                        value={day.id}
                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-white font-medium">
                                Day {day.dayNumber}: {day.title}
                              </span>
                              {day.scheduledUnlockDate && (
                                <span className="text-zinc-500 text-xs">
                                  Unlock: {fmtDateTime(day.scheduledUnlockDate)}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-400 hover:text-white h-7 px-2 cursor-pointer"
                                onClick={() => openEditDay(day)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 h-7 px-2 cursor-pointer"
                                onClick={() => handleDeleteDay(day.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-3">
                          {/* Sub-modules */}
                          {(day.subModules ?? [])
                            .sort((a, b) => a.order - b.order)
                            .map((sm) => (
                              <div
                                key={sm.id}
                                className="bg-zinc-900/80 border border-zinc-700 rounded-lg p-3"
                              >
                                {/* Sub-module header */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white text-sm font-medium">{sm.title}</span>
                                    {subModuleTypeBadge(sm)}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-zinc-400 hover:text-white h-7 px-2 cursor-pointer"
                                      onClick={() => openEditSubModule(day.id, sm)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-400 hover:text-red-300 h-7 px-2 cursor-pointer"
                                      onClick={() => handleDeleteSubModule(sm.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>

                                {/* Sub-module body */}
                                {sm.subModuleType === 'LEARNING'
                                  ? renderLearningContents(sm)
                                  : renderPracticeQuestions(sm)}
                              </div>
                            ))}

                          {(day.subModules ?? []).length === 0 && (
                            <p className="text-zinc-500 text-sm">No sub-modules added yet.</p>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer"
                            onClick={() => openAddSubModule(day.id)}
                          >
                            + Add Sub-Module
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              )}

              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer"
                onClick={openAddDay}
              >
                + Add Day
              </Button>
            </TabsContent>

            {/* ─── Batches Tab ────────────────────────────────────────────── */}
            <TabsContent value="batches" className="mt-4 space-y-4">
              {courseBatches.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No batches assigned. Assign batches to make this course available to students.
                </div>
              ) : (
                <div className="space-y-2">
                  {courseBatches.map((cb) => (
                    <div
                      key={cb.id}
                      className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 border border-zinc-700"
                    >
                      <span className="text-white text-sm">{cb.batch?.name ?? cb.batchId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 h-7 cursor-pointer"
                        onClick={() => handleUnassignBatch(cb.batchId)}
                      >
                        Unassign
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer"
                onClick={openBatchDialog}
              >
                + Assign Batch
              </Button>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Delete Confirmation Dialog                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteCourse} onOpenChange={(open) => !open && setDeleteCourse(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Course</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete <strong className="text-white">{deleteCourse?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => setDeleteCourse(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={deleteLoading}
              onClick={handleDeleteCourse}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Day Dialog                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">{editDay ? 'Edit Day' : 'Add Day'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editDay ? 'Update day details.' : 'Add a new day to the course.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Day Number</Label>
              <Input
                type="number"
                min={1}
                value={dayNumber}
                onChange={(e) => setDayNumber(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Title</Label>
              <Input
                placeholder="Day title"
                value={dayTitle}
                onChange={(e) => setDayTitle(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Scheduled Unlock Date (optional)</Label>
              <Input
                type="datetime-local"
                value={dayUnlockDate}
                onChange={(e) => setDayUnlockDate(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => setDayDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
              disabled={daySaving || !dayTitle.trim()}
              onClick={handleSaveDay}
            >
              {daySaving ? 'Saving...' : editDay ? 'Update Day' : 'Add Day'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Sub-Module Dialog                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={subModuleDialogOpen} onOpenChange={setSubModuleDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editSubModule ? 'Edit Sub-Module' : 'Add Sub-Module'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editSubModule ? 'Update sub-module details.' : 'Add a new sub-module to this day.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Title</Label>
              <Input
                placeholder="Sub-module title"
                value={smTitle}
                onChange={(e) => setSmTitle(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Type</Label>
              <Select value={smType} onValueChange={(v) => setSmType(v as 'LEARNING' | 'PRACTICE')}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="LEARNING" className="text-white">Learning</SelectItem>
                  <SelectItem value="PRACTICE" className="text-white">Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {smType === 'PRACTICE' && (
              <div>
                <Label className="text-zinc-300 mb-1.5 block">Practice Type</Label>
                <Select value={smPracticeType} onValueChange={(v) => setSmPracticeType(v as 'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED')}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="MCQ_ONLY" className="text-white">MCQ Only</SelectItem>
                    <SelectItem value="CODING_ONLY" className="text-white">Coding Only</SelectItem>
                    <SelectItem value="COMBINED" className="text-white">Combined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => setSubModuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
              disabled={smSaving || !smTitle.trim()}
              onClick={handleSaveSubModule}
            >
              {smSaving ? 'Saving...' : editSubModule ? 'Update Sub-Module' : 'Add Sub-Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Content Dialog (for LEARNING sub-modules)                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">{editContent ? 'Edit Content' : 'Add Content'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editContent ? 'Update content details.' : 'Add new content to this sub-module.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Title</Label>
              <Input
                placeholder="Content title"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as 'VIDEO' | 'PDF')}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="VIDEO" className="text-white">Video</SelectItem>
                  <SelectItem value="PDF" className="text-white">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">URL</Label>
              <Input
                placeholder="https://..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 mb-1.5 block">Duration (minutes)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={contentDuration}
                  onChange={(e) => setContentDuration(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 block">Order</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={contentOrder}
                  onChange={(e) => setContentOrder(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => setContentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
              disabled={contentSaving || !contentTitle.trim() || !contentUrl.trim()}
              onClick={handleSaveContent}
            >
              {contentSaving ? 'Saving...' : editContent ? 'Update Content' : 'Add Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Practice Question Picker Dialog                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={pqDialogOpen} onOpenChange={setPqDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Practice Questions</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Select questions to link to this practice sub-module.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={pqTab} onValueChange={(v) => setPqTab(v as 'mcq' | 'dsa')}>
            <TabsList className="bg-zinc-800 border-zinc-700 w-full">
              <TabsTrigger value="mcq" className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white cursor-pointer">
                MCQ Questions
              </TabsTrigger>
              <TabsTrigger value="dsa" className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white cursor-pointer">
                DSA Questions
              </TabsTrigger>
            </TabsList>

            {/* MCQ tab */}
            <TabsContent value="mcq" className="mt-3 space-y-3">
              <div>
                <Label className="text-zinc-300 mb-1.5 block text-xs">Filter by difficulty</Label>
                <Select value={mcqDifficulty} onValueChange={fetchFilteredMcq}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="ALL" className="text-white">All</SelectItem>
                    <SelectItem value="BEGINNER" className="text-white">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE" className="text-white">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED" className="text-white">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pqLoading ? (
                <div className="text-center py-4 text-zinc-400 text-sm">Loading...</div>
              ) : mcqQuestions.length === 0 ? (
                <div className="text-center py-4 text-zinc-500 text-sm">No MCQ questions found.</div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {mcqQuestions.map((q) => (
                    <label
                      key={q.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedMcqIds.has(q.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedMcqIds);
                          if (checked) next.add(q.id);
                          else next.delete(q.id);
                          setSelectedMcqIds(next);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm line-clamp-2">{q.questionText}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {difficultyBadge(q.difficulty)}
                          {q.category && (
                            <span className="text-zinc-500 text-xs">{q.category.name}</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* DSA tab */}
            <TabsContent value="dsa" className="mt-3 space-y-3">
              <div>
                <Label className="text-zinc-300 mb-1.5 block text-xs">Filter by difficulty</Label>
                <Select value={dsaDifficulty} onValueChange={fetchFilteredDsa}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="ALL" className="text-white">All</SelectItem>
                    <SelectItem value="EASY" className="text-white">Easy</SelectItem>
                    <SelectItem value="MEDIUM" className="text-white">Medium</SelectItem>
                    <SelectItem value="HARD" className="text-white">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pqLoading ? (
                <div className="text-center py-4 text-zinc-400 text-sm">Loading...</div>
              ) : dsaQuestions.length === 0 ? (
                <div className="text-center py-4 text-zinc-500 text-sm">No DSA questions found.</div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {dsaQuestions.map((q) => (
                    <label
                      key={q.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedDsaIds.has(q.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedDsaIds);
                          if (checked) next.add(q.id);
                          else next.delete(q.id);
                          setSelectedDsaIds(next);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm">{q.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {difficultyBadge(q.difficulty)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => setPqDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
              disabled={pqSaving || (selectedMcqIds.size === 0 && selectedDsaIds.size === 0)}
              onClick={handleAddSelectedQuestions}
            >
              {pqSaving ? 'Adding...' : `Add Selected (${selectedMcqIds.size + selectedDsaIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Batch Assignment Dialog                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Batches</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Select batches to assign to this course.
            </DialogDescription>
          </DialogHeader>
          {batchLoading ? (
            <div className="text-center py-6 text-zinc-400">Loading batches...</div>
          ) : allBatches.length === 0 ? (
            <div className="text-center py-6 text-zinc-500">No batches available.</div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {allBatches
                .filter((b) => !courseBatches.some((cb) => cb.batchId === b.id))
                .map((batch) => (
                  <label
                    key={batch.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800"
                  >
                    <Checkbox
                      checked={selectedBatchIds.has(batch.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedBatchIds);
                        if (checked) next.add(batch.id);
                        else next.delete(batch.id);
                        setSelectedBatchIds(next);
                      }}
                    />
                    <span className="text-white text-sm">{batch.name}</span>
                  </label>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => setBatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white cursor-pointer"
              disabled={batchLoading || selectedBatchIds.size === 0}
              onClick={handleAssignBatches}
            >
              {batchLoading ? 'Assigning...' : 'Assign Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
