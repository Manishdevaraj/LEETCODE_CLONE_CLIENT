import { useState, useEffect } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { useAuthStore } from '@/stores/authStore';
import { questionService } from '@/services/question.service';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
}

interface Question {
  id: string;
  title: string;
  description?: string;
  topic: string;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  memoryLimit: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  createdAt: string;
  _count?: { testCases: number };
  testCases?: TestCase[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function acceptanceRate(total: number, accepted: number): string {
  if (total === 0) return '--';
  return ((accepted / total) * 100).toFixed(1) + '%';
}

const EMPTY_TEST_CASE: () => TestCase = () => ({
  input: '',
  expectedOutput: '',
  isHidden: false,
  order: 1,
});

// ─── Component ──────────────────────────────────────────────────────────────

export default function QuestionBankPage() {
  const { user } = useAuthStore();
  const { questions: storeQuestions, isLoading: loading, error: storeError, fetchQuestions, clearError } = useQuestionStore();
  const questions = storeQuestions as unknown as Question[];

  // Local error state for dialog-level errors
  const [error, setError] = useState<string | null>(null);
  const displayError = error || storeError;

  // Filters
  const [searchTitle, setSearchTitle] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [difficulty, setDifficulty] = useState<string>('EASY');
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [testCases, setTestCases] = useState<TestCase[]>([EMPTY_TEST_CASE()]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // ─── Filtered list ────────────────────────────────────────────────────

  const filteredQuestions = questions.filter((q) => {
    const matchesTitle =
      !searchTitle.trim() || q.title.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesDifficulty =
      filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesTitle && matchesDifficulty;
  });

  // ─── Create / Edit ────────────────────────────────────────────────────

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTopic('');
    setConstraints('');
    setInputFormat('');
    setOutputFormat('');
    setDifficulty('EASY');
    setTimeLimit(2000);
    setMemoryLimit(256);
    setTestCases([EMPTY_TEST_CASE()]);
  };

  const openCreate = () => {
    setEditQuestion(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = async (q: Question) => {
    setEditQuestion(q);
    setError(null);
    try {
      const data = await questionService.getByIdAdmin(q.id) as unknown as Question;

      setTitle(data.title);
      setDescription(data.description ?? '');
      setTopic(data.topic ?? '');
      setConstraints(data.constraints ?? '');
      setInputFormat(data.inputFormat ?? '');
      setOutputFormat(data.outputFormat ?? '');
      setDifficulty(data.difficulty);
      setTimeLimit(data.timeLimit);
      setMemoryLimit(data.memoryLimit);
      setTestCases(
        data.testCases && data.testCases.length > 0
          ? data.testCases.map((tc) => ({
              id: tc.id,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden,
              order: tc.order,
            }))
          : [EMPTY_TEST_CASE()]
      );
      setDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch question details');
    }
  };

  // Test case helpers
  const addTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isHidden: false, order: prev.length + 1 },
    ]);
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((tc, i) => ({ ...tc, order: i + 1 }))
    );
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        topic: topic.trim() || null,
        constraints: constraints.trim() || null,
        inputFormat: inputFormat.trim() || null,
        outputFormat: outputFormat.trim() || null,
        difficulty,
        timeLimit,
        memoryLimit,
        ...(editQuestion ? {} : { createdById: user?.id }),
        testCases: testCases
          .filter((tc) => tc.input.trim() || tc.expectedOutput.trim())
          .map((tc, i) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            order: i + 1,
          })),
      };

      if (editQuestion) {
        await questionService.update(editQuestion.id, payload);
      } else {
        await questionService.create(payload);
      }

      setDialogOpen(false);
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await questionService.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Difficulty badge ─────────────────────────────────────────────────

  const difficultyBadge = (d: string) => {
    switch (d) {
      case 'EASY':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Easy
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            Medium
          </Badge>
        );
      case 'HARD':
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Hard</Badge>
        );
      default:
        return <Badge variant="secondary">{d}</Badge>;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <svg className="animate-spin h-8 w-8 text-zinc-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
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
            <h1 className="text-2xl font-bold text-white">Coding Question Bank</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage DSA and coding questions with test cases.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
          >
            Add Question
          </Button>
        </div>

        {/* Error banner */}
        {displayError && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span>{displayError}</span>
            <button
              onClick={() => { setError(null); clearError(); }}
              className="text-red-400 hover:text-red-300 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter row */}
        <div className="flex items-end gap-4 mb-6">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Search</Label>
            <Input
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="Search by title..."
              className="w-[260px] bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Difficulty</Label>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all" className="text-zinc-300">
                  All Levels
                </SelectItem>
                <SelectItem value="EASY" className="text-zinc-300">
                  Easy
                </SelectItem>
                <SelectItem value="MEDIUM" className="text-zinc-300">
                  Medium
                </SelectItem>
                <SelectItem value="HARD" className="text-zinc-300">
                  Hard
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Questions table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 w-[35%]">Title</TableHead>
                <TableHead className="text-zinc-400">Topic</TableHead>
                <TableHead className="text-zinc-400">Difficulty</TableHead>
                <TableHead className="text-zinc-400 text-center">Acceptance</TableHead>
                <TableHead className="text-zinc-400 text-center">Test Cases</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                    No questions found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((q) => (
                  <TableRow key={q.id} className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableCell className="font-medium text-white max-w-[400px]">
                      <span className="line-clamp-1">{q.title}</span>
                    </TableCell>
                    <TableCell className="text-zinc-400">{q.topic ?? '--'}</TableCell>
                    <TableCell>{difficultyBadge(q.difficulty)}</TableCell>
                    <TableCell className="text-center text-zinc-400">
                      {acceptanceRate(q.totalSubmissions, q.acceptedSubmissions)}
                    </TableCell>
                    <TableCell className="text-center text-zinc-400">
                      {q._count?.testCases ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(q)}
                          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(q)}
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

      {/* ─── Create/Edit Question Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editQuestion
                ? 'Update the question details and test cases.'
                : 'Create a new coding question with test cases.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Two Sum"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[160px]"
              />
            </div>

            {/* Topic + Difficulty row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Topic</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Arrays, Dynamic Programming..."
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="EASY" className="text-zinc-300">
                      Easy
                    </SelectItem>
                    <SelectItem value="MEDIUM" className="text-zinc-300">
                      Medium
                    </SelectItem>
                    <SelectItem value="HARD" className="text-zinc-300">
                      Hard
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Constraints</Label>
              <Textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text/plain');
                  // Collapse multiple newlines/whitespace into single lines separated by ", "
                  const cleaned = pasted
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .join(', ');
                  const textarea = e.currentTarget;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const current = constraints;
                  const newValue = current.slice(0, start) + cleaned + current.slice(end);
                  setConstraints(newValue);
                }}
                placeholder="e.g. 1 <= n <= 10^5"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[80px]"
              />
            </div>

            {/* Input / Output Format row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Input Format</Label>
                <Textarea
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  placeholder="Describe the input format..."
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Output Format</Label>
                <Textarea
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="Describe the expected output format..."
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[80px]"
                />
              </div>
            </div>

            {/* Time Limit + Memory Limit row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Time Limit (ms)</Label>
                <Input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Memory Limit (MB)</Label>
                <Input
                  type="number"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>

            {/* Test Cases */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300">Test Cases</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTestCase}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-7 text-xs"
                >
                  Add Test Case
                </Button>
              </div>

              {testCases.map((tc, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">
                      Test Case #{tc.order}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={tc.isHidden}
                          onCheckedChange={(checked) =>
                            updateTestCase(index, 'isHidden', !!checked)
                          }
                          className="border-zinc-700 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                        />
                        <span className="text-xs text-zinc-400">Hidden</span>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestCase(index)}
                        disabled={testCases.length <= 1}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs">Input</Label>
                      <Textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        placeholder="Test input..."
                        className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[70px] font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs">Expected Output</Label>
                      <Textarea
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          updateTestCase(index, 'expectedOutput', e.target.value)
                        }
                        placeholder="Expected output..."
                        className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[70px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {saving ? 'Saving...' : editQuestion ? 'Save Changes' : 'Create Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-zinc-300">{deleteTarget?.title}</div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
