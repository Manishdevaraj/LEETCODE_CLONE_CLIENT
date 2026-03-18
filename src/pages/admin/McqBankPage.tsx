import { useState, useEffect, useCallback } from 'react';
import { API_BASE, authFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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

interface McqCategory {
  id: string;
  name: string;
  description: string | null;
  _count?: { questions: number };
}

interface McqOption {
  id?: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

interface McqQuestion {
  id: string;
  questionText: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  topic: string | null;
  explanation: string | null;
  categoryId: string;
  category?: McqCategory;
  options: McqOption[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function McqBankPage() {
  // Data
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [categories, setCategories] = useState<McqCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [editCat, setEditCat] = useState<McqCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Question dialog
  const [qDialogOpen, setQDialogOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<McqQuestion | null>(null);
  const [qText, setQText] = useState('');
  const [qCategoryId, setQCategoryId] = useState('');
  const [qDifficulty, setQDifficulty] = useState<string>('BEGINNER');
  const [qTopic, setQTopic] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qOptions, setQOptions] = useState<McqOption[]>([
    { label: 'A', text: '', isCorrect: false },
    { label: 'B', text: '', isCorrect: false },
  ]);
  const [qSaving, setQSaving] = useState(false);

  // Delete
  const [deleteQuestion, setDeleteQuestion] = useState<McqQuestion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/mcq-categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterCategory && filterCategory !== 'all') params.set('categoryId', filterCategory);
      if (filterDifficulty && filterDifficulty !== 'all') params.set('difficulty', filterDifficulty);
      if (filterTopic.trim()) params.set('topic', filterTopic.trim());

      const [qRes, cRes] = await Promise.all([
        authFetch(`${API_BASE}/mcq-questions?${params}`),
        authFetch(`${API_BASE}/mcq-questions/count?${params}`),
      ]);
      if (!qRes.ok) throw new Error('Failed to fetch questions');
      const qData = await qRes.json();
      setQuestions(Array.isArray(qData) ? qData : qData.data ?? []);

      if (cRes.ok) {
        const cData = await cRes.json();
        setTotalCount(typeof cData === 'number' ? cData : cData.count ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    }
  }, [page, filterCategory, filterDifficulty, filterTopic]);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchQuestions()]).finally(() => setLoading(false));
  }, [fetchCategories, fetchQuestions]);

  // ─── Category CRUD ────────────────────────────────────────────────────

  const handleCreateCategory = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/mcq-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create category');
      }
      setCatName('');
      setCatDesc('');
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCatSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCat || !editCatName.trim()) return;
    setCatSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/mcq-categories/${editCat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCatName.trim(), description: editCatDesc.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update category');
      }
      setEditCat(null);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: McqCategory) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`${API_BASE}/mcq-categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete category');
      }
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  // ─── Question CRUD ────────────────────────────────────────────────────

  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

  const openCreateQuestion = () => {
    setEditQuestion(null);
    setQText('');
    setQCategoryId(categories[0]?.id ?? '');
    setQDifficulty('BEGINNER');
    setQTopic('');
    setQExplanation('');
    setQOptions([
      { label: 'A', text: '', isCorrect: false },
      { label: 'B', text: '', isCorrect: false },
    ]);
    setQDialogOpen(true);
  };

  const openEditQuestion = (q: McqQuestion) => {
    setEditQuestion(q);
    setQText(q.questionText);
    setQCategoryId(q.categoryId);
    setQDifficulty(q.difficulty);
    setQTopic(q.topic ?? '');
    setQExplanation(q.explanation ?? '');
    setQOptions(
      q.options.length > 0
        ? q.options.map((o, i) => ({ ...o, label: OPTION_LABELS[i] || String(i + 1) }))
        : [
            { label: 'A', text: '', isCorrect: false },
            { label: 'B', text: '', isCorrect: false },
          ]
    );
    setQDialogOpen(true);
  };

  const addOption = () => {
    if (qOptions.length >= 6) return;
    setQOptions([...qOptions, { label: OPTION_LABELS[qOptions.length], text: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (qOptions.length <= 2) return;
    const updated = qOptions.filter((_, i) => i !== index).map((o, i) => ({ ...o, label: OPTION_LABELS[i] }));
    setQOptions(updated);
  };

  const updateOptionText = (index: number, text: string) => {
    setQOptions(qOptions.map((o, i) => (i === index ? { ...o, text } : o)));
  };

  const toggleOptionCorrect = (index: number) => {
    setQOptions(qOptions.map((o, i) => (i === index ? { ...o, isCorrect: !o.isCorrect } : o)));
  };

  const handleSaveQuestion = async () => {
    if (!qText.trim() || !qCategoryId) return;
    if (qOptions.filter((o) => o.text.trim()).length < 2) {
      setError('At least 2 options with text are required');
      return;
    }
    if (!qOptions.some((o) => o.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }

    setQSaving(true);
    try {
      const payload = {
        questionText: qText.trim(),
        categoryId: qCategoryId,
        difficulty: qDifficulty,
        topic: qTopic.trim() || null,
        explanation: qExplanation.trim() || null,
        options: qOptions
          .filter((o) => o.text.trim())
          .map((o) => ({ label: o.label, text: o.text.trim(), isCorrect: o.isCorrect })),
      };

      const url = editQuestion
        ? `${API_BASE}/mcq-questions/${editQuestion.id}`
        : `${API_BASE}/mcq-questions`;
      const method = editQuestion ? 'PATCH' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save question');
      }

      setQDialogOpen(false);
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setQSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestion) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/mcq-questions/${deleteQuestion.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete question');
      }
      setDeleteQuestion(null);
      await fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Pagination ─────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  // ─── Difficulty badge color ────────────────────────────────────────

  const difficultyBadge = (d: string) => {
    switch (d) {
      case 'BEGINNER':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Beginner</Badge>;
      case 'INTERMEDIATE':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Intermediate</Badge>;
      case 'ADVANCED':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Advanced</Badge>;
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
            <h1 className="text-2xl font-bold text-white">MCQ Question Bank</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage multiple-choice questions across categories and difficulty levels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCatDialogOpen(true)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Manage Categories
            </Button>
            <Button
              onClick={openCreateQuestion}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              Add Question
            </Button>
          </div>
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

        {/* Filter row */}
        <div className="flex items-end gap-4 mb-6">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Category</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all" className="text-zinc-300">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-zinc-300">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Difficulty</Label>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all" className="text-zinc-300">All Levels</SelectItem>
                <SelectItem value="BEGINNER" className="text-zinc-300">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE" className="text-zinc-300">Intermediate</SelectItem>
                <SelectItem value="ADVANCED" className="text-zinc-300">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Topic</Label>
            <Input
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              placeholder="Filter by topic..."
              className="w-[200px] bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <Button
            onClick={handleSearch}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Search
          </Button>
        </div>

        {/* Questions table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 w-[40%]">Question</TableHead>
                <TableHead className="text-zinc-400">Category</TableHead>
                <TableHead className="text-zinc-400">Difficulty</TableHead>
                <TableHead className="text-zinc-400">Topic</TableHead>
                <TableHead className="text-zinc-400 text-center">Options</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                    No questions found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q) => (
                  <TableRow key={q.id} className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableCell className="font-medium text-white max-w-[400px]">
                      <span className="line-clamp-2">{q.questionText}</span>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {q.category?.name ?? '—'}
                    </TableCell>
                    <TableCell>{difficultyBadge(q.difficulty)}</TableCell>
                    <TableCell className="text-zinc-400">{q.topic ?? '—'}</TableCell>
                    <TableCell className="text-center text-zinc-400">
                      {q.options?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditQuestion(q)}
                          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteQuestion(q)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-zinc-400 hover:text-white"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={
                      pageNum === page
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="text-zinc-400 hover:text-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Categories Dialog ──────────────────────────────────────────────── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add, edit, and remove MCQ categories.
            </DialogDescription>
          </DialogHeader>

          {/* Add new category */}
          <div className="flex items-end gap-3 py-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-zinc-400 text-xs">Name</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Category name"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-zinc-400 text-xs">Description</Label>
              <Input
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Optional description"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <Button
              onClick={handleCreateCategory}
              disabled={!catName.trim() || catSaving}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              Add
            </Button>
          </div>

          {/* Category list */}
          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {categories.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No categories yet.</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-900/50"
                >
                  {editCat?.id === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white h-8 text-sm"
                      />
                      <Input
                        value={editCatDesc}
                        onChange={(e) => setEditCatDesc(e.target.value)}
                        placeholder="Description"
                        className="bg-zinc-900 border-zinc-800 text-white h-8 text-sm"
                      />
                      <Button size="sm" onClick={handleUpdateCategory} disabled={catSaving} className="bg-blue-600 hover:bg-blue-700 text-white h-8">
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditCat(null)} className="text-zinc-400 h-8">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm font-medium text-white">{cat.name}</span>
                        {cat.description && (
                          <span className="text-xs text-zinc-500 ml-2">{cat.description}</span>
                        )}
                        <Badge variant="secondary" className="ml-2 bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
                          {cat._count?.questions ?? 0} questions
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditCat(cat);
                            setEditCatName(cat.name);
                            setEditCatDesc(cat.description ?? '');
                          }}
                          className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCatDialogOpen(false)} className="text-zinc-400 hover:text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create/Edit Question Dialog ─────────────────────────────────────── */}
      <Dialog open={qDialogOpen} onOpenChange={setQDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editQuestion ? 'Update the question details and options.' : 'Create a new MCQ question with options.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Question text */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Question Text</Label>
              <Textarea
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Enter the question..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[80px]"
              />
            </div>

            {/* Category + Difficulty row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Category</Label>
                <Select value={qCategoryId} onValueChange={setQCategoryId}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-zinc-300">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Difficulty</Label>
                <Select value={qDifficulty} onValueChange={setQDifficulty}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="BEGINNER" className="text-zinc-300">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE" className="text-zinc-300">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED" className="text-zinc-300">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Topic</Label>
              <Input
                value={qTopic}
                onChange={(e) => setQTopic(e.target.value)}
                placeholder="e.g. Arrays, Sorting, OOP..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Explanation (optional)</Label>
              <Textarea
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Explain the correct answer..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[60px]"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300">Options</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={qOptions.length >= 6}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-7 text-xs"
                >
                  Add Option
                </Button>
              </div>

              {qOptions.map((opt, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-blue-400 w-6 text-center">{opt.label}</span>
                  <Input
                    value={opt.text}
                    onChange={(e) => updateOptionText(index, e.target.value)}
                    placeholder={`Option ${opt.label}`}
                    className="flex-1 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Checkbox
                      checked={opt.isCorrect}
                      onCheckedChange={() => toggleOptionCorrect(index)}
                      className="border-zinc-700 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <span className="text-xs text-zinc-400">Correct</span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={qOptions.length <= 2}
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setQDialogOpen(false)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={!qText.trim() || !qCategoryId || qSaving}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {qSaving ? 'Saving...' : editQuestion ? 'Save Changes' : 'Create Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <Dialog open={!!deleteQuestion} onOpenChange={(open) => !open && setDeleteQuestion(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-zinc-300 line-clamp-3">
            {deleteQuestion?.questionText}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteQuestion(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteQuestion}
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
