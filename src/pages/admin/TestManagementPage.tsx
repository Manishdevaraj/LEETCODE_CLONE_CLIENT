import { useState, useEffect, useCallback } from 'react';
import { testService } from '@/services/test.service';
import { testCategoryService } from '@/services/test-category.service';
import { mcqService } from '@/services/mcq.service';
import { questionService } from '@/services/question.service';
import { collegeService } from '@/services/college.service';
import { batchService } from '@/services/batch.service';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface TestCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  _count?: { tests: number };
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  testType: 'MCQ_ONLY' | 'CODING_ONLY' | 'COMBINED';
  durationMins: number;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string | null;
  endTime: string | null;
  isProctored: boolean;
  maxViolations?: number;
  accessCode: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string; color: string | null } | null;
  _count?: { testQuestions: number };
  testQuestions?: TestQuestion[];
  batchAssignments?: TestBatch[];
}

interface TestQuestion {
  id: string;
  testId: string;
  mcqQuestionId: string | null;
  questionId: string | null;
  marks: number;
  order: number;
  mcqQuestion?: { id: string; questionText: string; difficulty: string };
  question?: { id: string; title: string; difficulty: string };
}

interface TestBatch {
  id: string;
  testId: string;
  batchId: string;
  secureUrl: string | null;
  batch?: {
    id: string;
    name: string;
    department?: { id: string; name: string; college?: { id: string; name: string } };
  };
}

interface McqQuestion {
  id: string;
  questionText: string;
  difficulty: string;
  topic: string | null;
  category?: { id: string; name: string };
}

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: string;
}

interface McqCategory {
  id: string;
  name: string;
}

interface College {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  collegeId: string;
}

interface Batch {
  id: string;
  name: string;
  departmentId: string;
}

interface AutoGenRule {
  questionType: 'MCQ' | 'CODING';
  count: number;
  difficulty: string;
  topic: string;
  categoryId: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TestManagementPage() {
  // Data
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTest, setEditTest] = useState<Test | null>(null);
  const [activeSection, setActiveSection] = useState('basic');

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [testType, setTestType] = useState<string>('MCQ_ONLY');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isProctored, setIsProctored] = useState(false);
  const [maxViolations, setMaxViolations] = useState(3);
  const [accessCode, setAccessCode] = useState('');
  const [saving, setSaving] = useState(false);

  // Questions
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [questionMode, setQuestionMode] = useState<'manual' | 'auto'>('manual');

  // Question picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'MCQ' | 'CODING'>('MCQ');
  const [pickerQuestions, setPickerQuestions] = useState<McqQuestion[]>([]);
  const [pickerCodingQuestions, setPickerCodingQuestions] = useState<CodingQuestion[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerFilterDifficulty, setPickerFilterDifficulty] = useState('all');
  const [pickerFilterTopic, setPickerFilterTopic] = useState('');
  const [pickerFilterCategory, setPickerFilterCategory] = useState('all');
  const [selectedPickerIds, setSelectedPickerIds] = useState<Set<string>>(new Set());

  // Auto-generate
  const [autoRules, setAutoRules] = useState<AutoGenRule[]>([]);
  const [autoGenerating, setAutoGenerating] = useState(false);

  // Assignment
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [assignLoading, setAssignLoading] = useState(false);
  const [testBatches, setTestBatches] = useState<TestBatch[]>([]);

  // Categories for filters
  const [categories, setCategories] = useState<McqCategory[]>([]);

  // Test Categories
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<TestCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [catSaving, setCatSaving] = useState(false);
  const [catDeleting, setCatDeleting] = useState<string | null>(null);

  // Category filter on test list
  const [filterCategory, setFilterCategory] = useState('all');

  // Category dropdown in create/edit form
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Delete
  const [deleteTest, setDeleteTest] = useState<Test | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchTests = useCallback(async () => {
    try {
      const data = await testService.getAll();
      setTests(Array.isArray(data) ? data as unknown as Test[] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await mcqService.getCategories();
      setCategories(Array.isArray(data) ? data as unknown as McqCategory[] : []);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTestCategories = useCallback(async () => {
    try {
      const data = await testCategoryService.getAll();
      setTestCategories(Array.isArray(data) ? data as unknown as TestCategory[] : []);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([fetchTests(), fetchCategories(), fetchTestCategories()]).finally(() => setLoading(false));
  }, [fetchTests, fetchCategories, fetchTestCategories]);

  // ─── Test CRUD ──────────────────────────────────────────────────────

  const openCreateSheet = () => {
    setEditTest(null);
    setTitle('');
    setDescription('');
    setTestType('MCQ_ONLY');
    setDuration(60);
    setStartTime('');
    setEndTime('');
    setIsProctored(false);
    setAccessCode('');
    setTestQuestions([]);
    setTestBatches([]);
    setActiveSection('basic');
    setAutoRules([]);
    setQuestionMode('manual');
    setSelectedCategoryId('');
    setSheetOpen(true);
  };

  const openEditSheet = async (test: Test) => {
    setEditTest(test);
    setTitle(test.title);
    setDescription(test.description ?? '');
    setTestType(test.testType);
    setDuration(test.durationMins);
    setStartTime(test.startTime ? new Date(test.startTime).toISOString().slice(0, 16) : '');
    setEndTime(test.endTime ? new Date(test.endTime).toISOString().slice(0, 16) : '');
    setIsProctored(test.isProctored);
    setMaxViolations(test.maxViolations ?? 3);
    setAccessCode(test.accessCode ?? '');
    setActiveSection('basic');
    setAutoRules([]);
    setQuestionMode('manual');
    setSelectedCategoryId(test.categoryId ?? '');
    setSheetOpen(true);

    // Fetch test details (questions + batches)
    try {
      const data = await testService.getById(test.id);
      setTestQuestions((data as any).testQuestions ?? []);
      setTestBatches((data as any).batchAssignments ?? []);
    } catch { /* ignore */ }
  };

  const handleSaveBasicInfo = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        testType,
        durationMins: duration,
        isProctored,
      };
      if (description.trim()) payload.description = description.trim();
      if (startTime) payload.startTime = new Date(startTime).toISOString();
      if (endTime) payload.endTime = new Date(endTime).toISOString();
      if (isProctored) payload.maxViolations = maxViolations;
      if (accessCode.trim()) payload.accessCode = accessCode.trim();
      payload.categoryId = selectedCategoryId && selectedCategoryId !== 'none' ? selectedCategoryId : undefined;

      const saved = editTest
        ? await testService.update(editTest.id, payload as any)
        : await testService.create(payload as any);
      if (!editTest) {
        setEditTest(saved);
      }
      await fetchTests();
      setActiveSection('questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!deleteTest) return;
    setDeleteLoading(true);
    try {
      await testService.delete(deleteTest.id);
      setDeleteTest(null);
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete test');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (test: Test, newStatus: string) => {
    try {
      await testService.updateStatus(test.id, newStatus);
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // ─── Question picker ────────────────────────────────────────────────

  const openQuestionPicker = async (type: 'MCQ' | 'CODING') => {
    setPickerType(type);
    setPickerFilterDifficulty('all');
    setPickerFilterTopic('');
    setPickerFilterCategory('all');
    setSelectedPickerIds(new Set());
    setPickerOpen(true);
    await fetchPickerQuestions(type, 'all', '', 'all');
  };

  const fetchPickerQuestions = async (
    type: 'MCQ' | 'CODING',
    difficulty: string,
    topic: string,
    categoryId: string
  ) => {
    setPickerLoading(true);
    try {
      if (type === 'MCQ') {
        const mcqParams: any = { page: 1, limit: 50 };
        if (difficulty !== 'all') mcqParams.difficulty = difficulty;
        if (topic.trim()) mcqParams.topic = topic.trim();
        if (categoryId !== 'all') mcqParams.categoryId = categoryId;
        const data = await mcqService.getQuestions(mcqParams);
        setPickerQuestions(Array.isArray(data) ? data as unknown as McqQuestion[] : []);
      } else {
        const codingParams: any = { page: 1, limit: 50 };
        if (difficulty !== 'all') codingParams.difficulty = difficulty;
        const data = await questionService.getAll(codingParams);
        setPickerCodingQuestions(Array.isArray(data) ? data as unknown as CodingQuestion[] : []);
      }
    } catch { /* ignore */ } finally {
      setPickerLoading(false);
    }
  };

  const handlePickerSearch = () => {
    fetchPickerQuestions(pickerType, pickerFilterDifficulty, pickerFilterTopic, pickerFilterCategory);
  };

  const togglePickerQuestion = (id: string) => {
    setSelectedPickerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddPickedQuestions = async () => {
    if (!editTest || selectedPickerIds.size === 0) return;
    setPickerLoading(true);
    try {
      for (const qId of selectedPickerIds) {
        const payload = pickerType === 'MCQ'
          ? { mcqQuestionId: qId, marks: 1 }
          : { questionId: qId, marks: 5 };
        await testService.addQuestion(editTest.id, payload as any);
      }
      setPickerOpen(false);
      // Refresh test questions
      const detail = await testService.getById(editTest.id);
      setTestQuestions((detail as any).testQuestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add questions');
    } finally {
      setPickerLoading(false);
    }
  };

  const handleRemoveQuestion = async (tqId: string) => {
    if (!editTest) return;
    try {
      await testService.removeQuestion(editTest.id, tqId);
      setTestQuestions((prev) => prev.filter((q) => q.id !== tqId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove question');
    }
  };

  const handleUpdateMarks = async (tq: TestQuestion, marks: number) => {
    // Optimistic update
    setTestQuestions((prev) =>
      prev.map((q) => (q.id === tq.id ? { ...q, marks } : q))
    );
  };

  // ─── Auto-generate ──────────────────────────────────────────────────

  const addAutoRule = () => {
    setAutoRules([
      ...autoRules,
      { questionType: 'MCQ', count: 5, difficulty: 'BEGINNER', topic: '', categoryId: '' },
    ]);
  };

  const updateAutoRule = (index: number, field: keyof AutoGenRule, value: string | number) => {
    setAutoRules(autoRules.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeAutoRule = (index: number) => {
    setAutoRules(autoRules.filter((_, i) => i !== index));
  };

  const handleAutoGenerate = async () => {
    if (!editTest || autoRules.length === 0) return;
    setAutoGenerating(true);
    try {
      await testService.autoGenerate(editTest.id, autoRules as any);
      // Refresh test questions
      const detail = await testService.getById(editTest.id);
      setTestQuestions((detail as any).testQuestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-generate questions');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleRegenerateQuestion = async (tqId: string) => {
    if (!editTest) return;
    try {
      const newTq = await testService.regenerateQuestion(editTest.id, tqId);
      setTestQuestions((prev) => prev.map((q) => (q.id === tqId ? newTq as unknown as TestQuestion : q)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate question');
    }
  };

  // ─── Batch assignment ───────────────────────────────────────────────

  const fetchColleges = async () => {
    try {
      const data = await collegeService.getAll();
      setColleges(Array.isArray(data) ? data as unknown as College[] : []);
    } catch { /* ignore */ }
  };

  const fetchDepartments = async (collegeId: string) => {
    try {
      const data = await collegeService.getDepartments(collegeId);
      setDepartments(Array.isArray(data) ? data as unknown as Department[] : []);
    } catch { /* ignore */ }
  };

  const fetchBatches = async (deptId: string) => {
    try {
      const data = await batchService.getByDepartment(deptId);
      setBatches(Array.isArray(data) ? data as unknown as Batch[] : []);
    } catch { /* ignore */ }
  };

  const handleCollegeChange = (collegeId: string) => {
    setSelectedCollegeId(collegeId);
    setSelectedDeptId('');
    setBatches([]);
    setSelectedBatchIds(new Set());
    if (collegeId) fetchDepartments(collegeId);
  };

  const handleDeptChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSelectedBatchIds(new Set());
    if (deptId) fetchBatches(deptId);
  };

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  const handleAssignBatches = async () => {
    if (!editTest || selectedBatchIds.size === 0) return;
    setAssignLoading(true);
    try {
      await testService.assignBatches(editTest.id, { batchIds: Array.from(selectedBatchIds) } as any);
      setSelectedBatchIds(new Set());
      // Refresh
      const detail = await testService.getById(editTest.id);
      setTestBatches((detail as any).batchAssignments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign batches');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignBatch = async (batchId: string) => {
    if (!editTest) return;
    try {
      await testService.unassignBatch(editTest.id, batchId);
      setTestBatches((prev) => prev.filter((b) => b.batchId !== batchId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign batch');
    }
  };

  // ─── Test Category CRUD ─────────────────────────────────────────────

  const COLOR_PRESETS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];

  const openCategoryDialog = () => {
    setEditCategory(null);
    setCatName('');
    setCatDescription('');
    setCatColor('#3b82f6');
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (cat: TestCategory) => {
    setEditCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description ?? '');
    setCatColor(cat.color ?? '#3b82f6');
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const payload: any = { name: catName.trim() };
      if (catDescription.trim()) payload.description = catDescription.trim();
      if (catColor) payload.color = catColor;

      if (editCategory) {
        await testCategoryService.update(editCategory.id, payload as any);
      } else {
        await testCategoryService.create(payload as any);
      }

      await fetchTestCategories();
      setEditCategory(null);
      setCatName('');
      setCatDescription('');
      setCatColor('#3b82f6');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setCatDeleting(catId);
    try {
      await testCategoryService.delete(catId);
      await fetchTestCategories();
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setCatDeleting(null);
    }
  };

  // ─── Status badge ──────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge className="bg-zinc-700/50 text-zinc-300 border-zinc-600">Draft</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Scheduled</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Active</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'MCQ_ONLY':
        return <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20">MCQ Only</Badge>;
      case 'CODING_ONLY':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Coding Only</Badge>;
      case 'COMBINED':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Combined</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const difficultyBadge = (d: string) => {
    switch (d) {
      case 'BEGINNER': case 'EASY':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{d}</Badge>;
      case 'INTERMEDIATE': case 'MEDIUM':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">{d}</Badge>;
      case 'ADVANCED': case 'HARD':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{d}</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{d}</Badge>;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <svg className="animate-spin h-8 w-8 text-zinc-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Test Management</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Create and manage tests, assign questions, and distribute to batches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={openCategoryDialog}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Manage Categories
            </Button>
            <Button
              onClick={openCreateSheet}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              Create Test
            </Button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-3 mb-6">
          <Label className="text-zinc-400 text-sm">Filter by Category:</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all" className="text-zinc-300">All categories</SelectItem>
              <SelectItem value="uncategorized" className="text-zinc-300">Uncategorized</SelectItem>
              {testCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-zinc-300">
                  <span className="flex items-center gap-2">
                    {cat.color && (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Tests table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Title</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Category</TableHead>
                <TableHead className="text-zinc-400">Duration</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 text-center">Questions</TableHead>
                <TableHead className="text-zinc-400">Start Time</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={8} className="text-center text-zinc-500 py-12">
                    No tests created yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                tests
                  .filter((test) => {
                    if (filterCategory === 'all') return true;
                    if (filterCategory === 'uncategorized') return !test.categoryId;
                    return test.categoryId === filterCategory;
                  })
                  .map((test) => (
                  <TableRow key={test.id} className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableCell className="font-medium text-white">{test.title}</TableCell>
                    <TableCell>{typeBadge(test.testType)}</TableCell>
                    <TableCell>
                      {test.category ? (
                        <Badge
                          className="border text-xs"
                          style={{
                            backgroundColor: test.category.color ? `${test.category.color}15` : undefined,
                            color: test.category.color ?? '#a1a1aa',
                            borderColor: test.category.color ? `${test.category.color}30` : '#3f3f46',
                          }}
                        >
                          {test.category.name}
                        </Badge>
                      ) : (
                        <span className="text-zinc-600">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-400">{test.durationMins} min</TableCell>
                    <TableCell>{statusBadge(test.status)}</TableCell>
                    <TableCell className="text-center text-zinc-400">
                      {test._count?.testQuestions ?? 0}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {test.startTime
                        ? new Date(test.startTime).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {test.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(test, 'SCHEDULED')}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            Schedule
                          </Button>
                        )}
                        {test.status === 'SCHEDULED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(test, 'ACTIVE')}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditSheet(test)}
                          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTest(test)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Create/Edit Test Sheet ──────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="bg-zinc-950 border-zinc-800 text-white w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-white">
              {editTest ? `Edit: ${editTest.title}` : 'Create New Test'}
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              {editTest
                ? 'Update test details, manage questions, and assign to batches.'
                : 'Configure test settings, then add questions.'}
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeSection} onValueChange={setActiveSection} className="mt-6">
            <TabsList className="bg-zinc-900 border border-zinc-800 w-full justify-start">
              <TabsTrigger value="basic" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="questions"
                disabled={!editTest}
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white disabled:opacity-40"
              >
                Questions
              </TabsTrigger>
              <TabsTrigger
                value="assignment"
                disabled={!editTest}
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white disabled:opacity-40"
              >
                Assignment
              </TabsTrigger>
            </TabsList>

            {/* ─── Section 1: Basic Info ───────────────────────────────── */}
            <TabsContent value="basic" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Exam - Data Structures"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Test description..."
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Test Type</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="MCQ_ONLY" className="text-zinc-300">MCQ Only</SelectItem>
                      <SelectItem value="CODING_ONLY" className="text-zinc-300">Coding Only</SelectItem>
                      <SelectItem value="COMBINED" className="text-zinc-300">Combined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min={1}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Category</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-full">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="none" className="text-zinc-300">No category</SelectItem>
                    {testCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-zinc-300">
                        <span className="flex items-center gap-2">
                          {cat.color && (
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">End Time</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-zinc-300">Proctored</Label>
                  <p className="text-xs text-zinc-500">Enable webcam and screen monitoring</p>
                </div>
                <Switch
                  checked={isProctored}
                  onCheckedChange={setIsProctored}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {isProctored && (
                <div className="space-y-2 ml-1">
                  <Label className="text-zinc-300">Max Violations Before Auto-Submit</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={maxViolations}
                    onChange={(e) => setMaxViolations(parseInt(e.target.value) || 3)}
                    className="bg-zinc-900 border-zinc-800 text-white w-32"
                  />
                  <p className="text-xs text-zinc-500">Number of fullscreen exits allowed before auto-submit (default: 3)</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-zinc-300">Access Code (optional)</Label>
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Leave empty for no access code"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>

              <Separator className="bg-zinc-800" />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBasicInfo}
                  disabled={!title.trim() || saving}
                  className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
                >
                  {saving ? 'Saving...' : editTest ? 'Save & Continue' : 'Create & Continue'}
                </Button>
              </div>
            </TabsContent>

            {/* ─── Section 2: Questions ────────────────────────────────── */}
            <TabsContent value="questions" className="mt-4 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant={questionMode === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuestionMode('manual')}
                  className={
                    questionMode === 'manual'
                      ? 'bg-zinc-800 text-white'
                      : 'border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }
                >
                  Manual
                </Button>
                <Button
                  variant={questionMode === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuestionMode('auto')}
                  className={
                    questionMode === 'auto'
                      ? 'bg-zinc-800 text-white'
                      : 'border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }
                >
                  Auto-Generate
                </Button>
              </div>

              {questionMode === 'manual' ? (
                <>
                  <div className="flex items-center gap-3">
                    {(testType === 'MCQ_ONLY' || testType === 'COMBINED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuestionPicker('MCQ')}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        Add MCQ Question
                      </Button>
                    )}
                    {(testType === 'CODING_ONLY' || testType === 'COMBINED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuestionPicker('CODING')}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        Add Coding Question
                      </Button>
                    )}
                  </div>

                  {/* Current questions list */}
                  {testQuestions.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-8">
                      No questions added yet. Use the buttons above to add questions.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {testQuestions
                        .sort((a, b) => a.order - b.order)
                        .map((tq, idx) => (
                          <div
                            key={tq.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-900/50"
                          >
                            <span className="text-xs text-zinc-500 w-6 text-center">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-white truncate block">
                                {tq.mcqQuestionId
                                  ? tq.mcqQuestion?.questionText ?? 'MCQ Question'
                                  : tq.question?.title ?? 'Coding Question'}
                              </span>
                            </div>
                            <Badge
                              className={
                                tq.mcqQuestionId
                                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs'
                              }
                            >
                              {tq.mcqQuestionId ? 'MCQ' : 'CODING'}
                            </Badge>
                            {difficultyBadge(
                              tq.mcqQuestion?.difficulty ?? tq.question?.difficulty ?? ''
                            )}
                            <div className="flex items-center gap-1.5">
                              <Label className="text-xs text-zinc-500">Marks:</Label>
                              <Input
                                type="number"
                                value={tq.marks}
                                onChange={(e) => handleUpdateMarks(tq, Number(e.target.value))}
                                min={1}
                                className="w-16 h-7 bg-zinc-900 border-zinc-800 text-white text-xs"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegenerateQuestion(tq.id)}
                              className="text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 h-7 px-2 text-xs"
                            >
                              Swap
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveQuestion(tq.id)}
                              className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2 text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                /* Auto-generate mode */
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAutoRule}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Add Rule
                  </Button>

                  {autoRules.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-8">
                      No rules defined. Add a rule to auto-generate questions.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {autoRules.map((rule, idx) => (
                        <div key={idx} className="flex items-end gap-3 p-3 rounded-lg border border-zinc-800">
                          <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs">Type</Label>
                            <Select
                              value={rule.questionType}
                              onValueChange={(v) => updateAutoRule(idx, 'questionType', v)}
                            >
                              <SelectTrigger className="w-[110px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="MCQ" className="text-zinc-300">MCQ</SelectItem>
                                <SelectItem value="CODING" className="text-zinc-300">Coding</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs">Count</Label>
                            <Input
                              type="number"
                              value={rule.count}
                              onChange={(e) => updateAutoRule(idx, 'count', Number(e.target.value))}
                              min={1}
                              className="w-[70px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs">Difficulty</Label>
                            <Select
                              value={rule.difficulty}
                              onValueChange={(v) => updateAutoRule(idx, 'difficulty', v)}
                            >
                              <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="BEGINNER" className="text-zinc-300">Beginner</SelectItem>
                                <SelectItem value="INTERMEDIATE" className="text-zinc-300">Intermediate</SelectItem>
                                <SelectItem value="ADVANCED" className="text-zinc-300">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs">Topic</Label>
                            <Input
                              value={rule.topic}
                              onChange={(e) => updateAutoRule(idx, 'topic', e.target.value)}
                              placeholder="Any"
                              className="w-[100px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs placeholder:text-zinc-600"
                            />
                          </div>

                          {rule.questionType === 'MCQ' && (
                            <div className="space-y-1.5">
                              <Label className="text-zinc-400 text-xs">Category</Label>
                              <Select
                                value={rule.categoryId}
                                onValueChange={(v) => updateAutoRule(idx, 'categoryId', v)}
                              >
                                <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs">
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                  <SelectItem value="" className="text-zinc-300">Any</SelectItem>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id} className="text-zinc-300">
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAutoRule(idx)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}

                      <Button
                        onClick={handleAutoGenerate}
                        disabled={autoGenerating || autoRules.length === 0}
                        className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
                      >
                        {autoGenerating ? 'Generating...' : 'Generate Questions'}
                      </Button>
                    </div>
                  )}

                  {/* Show current questions below auto-generate */}
                  {testQuestions.length > 0 && (
                    <>
                      <Separator className="bg-zinc-800" />
                      <p className="text-sm text-zinc-400">
                        Current questions ({testQuestions.length}):
                      </p>
                      <div className="space-y-2">
                        {testQuestions.map((tq, idx) => (
                          <div
                            key={tq.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-800"
                          >
                            <span className="text-xs text-zinc-500 w-6 text-center">{idx + 1}</span>
                            <span className="flex-1 text-sm text-white truncate">
                              {tq.mcqQuestionId
                                ? tq.mcqQuestion?.questionText ?? 'MCQ Question'
                                : tq.question?.title ?? 'Coding Question'}
                            </span>
                            <Badge className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                              {tq.mcqQuestionId ? 'MCQ' : 'CODING'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegenerateQuestion(tq.id)}
                              className="text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 h-7 px-2 text-xs"
                            >
                              Regenerate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveQuestion(tq.id)}
                              className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2 text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ─── Section 3: Assignment ───────────────────────────────── */}
            <TabsContent value="assignment" className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Assign to Batches</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">College</Label>
                    <Select
                      value={selectedCollegeId}
                      onValueChange={handleCollegeChange}
                      onOpenChange={(open) => {
                        if (open && colleges.length === 0) fetchColleges();
                      }}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-full">
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {colleges.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-zinc-300">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Department</Label>
                    <Select
                      value={selectedDeptId}
                      onValueChange={handleDeptChange}
                      disabled={!selectedCollegeId}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-zinc-300">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleAssignBatches}
                      disabled={selectedBatchIds.size === 0 || assignLoading}
                      className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white w-full"
                    >
                      {assignLoading ? 'Assigning...' : 'Assign'}
                    </Button>
                  </div>
                </div>

                {/* Batch list for selection */}
                {batches.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-[200px] overflow-y-auto">
                    {batches.map((b) => (
                      <label
                        key={b.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedBatchIds.has(b.id)}
                          onCheckedChange={() => toggleBatch(b.id)}
                          className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <span className="text-sm text-white">{b.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-zinc-800" />

              {/* Assigned batches */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Assigned Batches ({testBatches.length})
                </h3>
                {testBatches.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-6">
                    No batches assigned yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {testBatches.map((tb) => (
                      <div
                        key={tb.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-800"
                      >
                        <div>
                          <span className="text-sm font-medium text-white">
                            {tb.batch?.name ?? 'Batch'}
                          </span>
                          {tb.batch?.department && (
                            <span className="text-xs text-zinc-500 ml-2">
                              {tb.batch.department.college?.name} / {tb.batch.department.name}
                            </span>
                          )}
                          {tb.secureUrl && (
                            <div className="text-xs text-zinc-600 mt-0.5 font-mono truncate max-w-[300px]">
                              {tb.secureUrl}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignBatch(tb.batchId)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* ─── Question Picker Dialog ──────────────────────────────────────────── */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Select {pickerType === 'MCQ' ? 'MCQ' : 'Coding'} Questions
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Choose questions to add to this test.
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex items-end gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Difficulty</Label>
              <Select value={pickerFilterDifficulty} onValueChange={setPickerFilterDifficulty}>
                <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all" className="text-zinc-300">All</SelectItem>
                  <SelectItem value="BEGINNER" className="text-zinc-300">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE" className="text-zinc-300">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED" className="text-zinc-300">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pickerType === 'MCQ' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Category</Label>
                  <Select value={pickerFilterCategory} onValueChange={setPickerFilterCategory}>
                    <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="all" className="text-zinc-300">All</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-zinc-300">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Topic</Label>
                  <Input
                    value={pickerFilterTopic}
                    onChange={(e) => setPickerFilterTopic(e.target.value)}
                    placeholder="Filter topic..."
                    className="w-[140px] bg-zinc-900 border-zinc-800 text-white h-8 text-xs placeholder:text-zinc-600"
                  />
                </div>
              </>
            )}

            <Button
              onClick={handlePickerSearch}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-8"
            >
              Search
            </Button>
          </div>

          {/* Question list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 py-2">
            {pickerLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-6 w-6 text-zinc-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : pickerType === 'MCQ' ? (
              pickerQuestions.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">No MCQ questions found.</p>
              ) : (
                pickerQuestions.map((q) => (
                  <label
                    key={q.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedPickerIds.has(q.id)}
                      onCheckedChange={() => togglePickerQuestion(q.id)}
                      className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white line-clamp-1">{q.questionText}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {q.category && (
                          <span className="text-xs text-zinc-500">{q.category.name}</span>
                        )}
                        {q.topic && <span className="text-xs text-zinc-600">{q.topic}</span>}
                      </div>
                    </div>
                    {difficultyBadge(q.difficulty)}
                  </label>
                ))
              )
            ) : pickerCodingQuestions.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No coding questions found.</p>
            ) : (
              pickerCodingQuestions.map((q) => (
                <label
                  key={q.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedPickerIds.has(q.id)}
                    onCheckedChange={() => togglePickerQuestion(q.id)}
                    className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="flex-1 text-sm text-white">{q.title}</span>
                  {difficultyBadge(q.difficulty)}
                </label>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-500 mr-auto">
              {selectedPickerIds.size} selected
            </span>
            <Button variant="ghost" onClick={() => setPickerOpen(false)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleAddPickedQuestions}
              disabled={selectedPickerIds.size === 0 || pickerLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              Add {selectedPickerIds.size} Question{selectedPickerIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Category Management Dialog ──────────────────────────────────────── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Test Categories</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create, edit, and delete test categories to organize your tests.
            </DialogDescription>
          </DialogHeader>

          {/* Category form */}
          <div className="space-y-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <h4 className="text-sm font-medium text-zinc-300">
              {editCategory ? 'Edit Category' : 'New Category'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Name</Label>
                <Input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Programming Fundamentals"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Color</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCatColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          catColor === c ? 'border-white scale-110' : 'border-transparent hover:border-zinc-600'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <Input
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    placeholder="#hex"
                    className="w-[90px] bg-zinc-900 border-zinc-800 text-white text-xs h-8"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Description (optional)</Label>
              <Textarea
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                placeholder="Brief description of the category..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[50px] text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveCategory}
                disabled={!catName.trim() || catSaving}
                className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
                size="sm"
              >
                {catSaving ? 'Saving...' : editCategory ? 'Update Category' : 'Create Category'}
              </Button>
              {editCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditCategory(null);
                    setCatName('');
                    setCatDescription('');
                    setCatColor('#3b82f6');
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          {/* Existing categories list */}
          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {testCategories.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">
                No categories created yet.
              </p>
            ) : (
              testCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color ?? '#3b82f6' }}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                      {cat.description && (
                        <p className="text-xs text-zinc-500 truncate">{cat.description}</p>
                      )}
                    </div>
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs ml-2">
                      {cat._count?.tests ?? 0} test{(cat._count?.tests ?? 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditCategoryDialog(cat)}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 px-2 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat.id)}
                      disabled={catDeleting === cat.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2 text-xs"
                    >
                      {catDeleting === cat.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-zinc-800 pt-3">
            <Button
              variant="ghost"
              onClick={() => setCategoryDialogOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <Dialog open={!!deleteTest} onOpenChange={(open) => !open && setDeleteTest(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete <strong className="text-white">{deleteTest?.title}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTest(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTest}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
