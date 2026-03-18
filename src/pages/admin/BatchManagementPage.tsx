import { useState, useEffect, useCallback } from 'react';
import { API_BASE, authFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ─── Types ──────────────────────────────────────────────────────────────────

interface College {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  year: number | null;
  semester: number | null;
  departmentId: string;
  _count?: { batchStudents: number; batchTeachers: number };
}

interface BatchDetail extends Batch {
  batchStudents: { user: BatchUser }[];
  batchTeachers: { user: BatchUser }[];
}

interface BatchUser {
  id: string;
  name: string | null;
  email: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BatchManagementPage() {
  // Filters
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // Batches
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch detail dialog
  const [detailBatch, setDetailBatch] = useState<BatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create batch dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createYear, setCreateYear] = useState('');
  const [createSemester, setCreateSemester] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit batch dialog
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete batch dialog
  const [deleteBatch, setDeleteBatch] = useState<Batch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add students/teachers dialog
  const [addMemberType, setAddMemberType] = useState<'students' | 'teachers' | null>(null);
  const [addMemberBatchId, setAddMemberBatchId] = useState<string>('');
  const [addMemberEmails, setAddMemberEmails] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchColleges = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/colleges`);
      if (!res.ok) throw new Error('Failed to fetch colleges');
      setColleges(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch colleges');
    }
  }, []);

  const fetchDepartments = useCallback(async (collegeId: string) => {
    try {
      const res = await authFetch(`${API_BASE}/colleges/${collegeId}/departments`);
      if (!res.ok) throw new Error('Failed to fetch departments');
      setDepartments(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
    }
  }, []);

  const fetchBatches = useCallback(async (deptId: string) => {
    setBatchLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/departments/${deptId}/batches`);
      if (!res.ok) throw new Error('Failed to fetch batches');
      setBatches(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batches');
    } finally {
      setBatchLoading(false);
    }
  }, []);

  const fetchBatchDetail = useCallback(async (batchId: string) => {
    setDetailLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/batches/${batchId}`);
      if (!res.ok) throw new Error('Failed to fetch batch details');
      const data = await res.json();
      setDetailBatch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batch details');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColleges().finally(() => setLoading(false));
  }, [fetchColleges]);

  // Cascading: college change -> load departments
  useEffect(() => {
    if (selectedCollegeId) {
      setSelectedDeptId('');
      setBatches([]);
      fetchDepartments(selectedCollegeId);
    } else {
      setDepartments([]);
      setSelectedDeptId('');
      setBatches([]);
    }
  }, [selectedCollegeId, fetchDepartments]);

  // Department change -> load batches
  useEffect(() => {
    if (selectedDeptId) {
      fetchBatches(selectedDeptId);
    } else {
      setBatches([]);
    }
  }, [selectedDeptId, fetchBatches]);

  // ─── Batch CRUD ─────────────────────────────────────────────────────────

  const handleCreateBatch = async () => {
    if (!createName.trim() || !selectedDeptId) return;
    setCreateLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/departments/${selectedDeptId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          year: createYear ? parseInt(createYear) : null,
          semester: createSemester ? parseInt(createSemester) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create batch');
      }
      setCreateOpen(false);
      setCreateName('');
      setCreateYear('');
      setCreateSemester('');
      await fetchBatches(selectedDeptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditBatch = (batch: Batch) => {
    setEditBatch(batch);
    setEditName(batch.name);
    setEditYear(batch.year?.toString() ?? '');
    setEditSemester(batch.semester?.toString() ?? '');
  };

  const handleEditBatch = async () => {
    if (!editBatch || !editName.trim()) return;
    setEditLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/batches/${editBatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          year: editYear ? parseInt(editYear) : null,
          semester: editSemester ? parseInt(editSemester) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update batch');
      }
      setEditBatch(null);
      if (selectedDeptId) await fetchBatches(selectedDeptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update batch');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatch) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/batches/${deleteBatch.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete batch');
      }
      setDeleteBatch(null);
      if (detailBatch?.id === deleteBatch.id) setDetailBatch(null);
      if (selectedDeptId) await fetchBatches(selectedDeptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Add/Remove members ──────────────────────────────────────────────────

  const openAddMember = (batchId: string, type: 'students' | 'teachers') => {
    setAddMemberBatchId(batchId);
    setAddMemberType(type);
    setAddMemberEmails('');
  };

  const handleAddMembers = async () => {
    if (!addMemberBatchId || !addMemberType || !addMemberEmails.trim()) return;
    setAddMemberLoading(true);
    try {
      const emails = addMemberEmails.split(',').map((e) => e.trim()).filter(Boolean);
      const res = await authFetch(`${API_BASE}/batches/${addMemberBatchId}/${addMemberType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Failed to add ${addMemberType}`);
      }
      setAddMemberType(null);
      setAddMemberEmails('');
      await fetchBatchDetail(addMemberBatchId);
      if (selectedDeptId) await fetchBatches(selectedDeptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to add ${addMemberType}`);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (batchId: string, userId: string, type: 'students' | 'teachers') => {
    try {
      const res = await authFetch(`${API_BASE}/batches/${batchId}/${type}/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Failed to remove ${type.slice(0, -1)}`);
      }
      await fetchBatchDetail(batchId);
      if (selectedDeptId) await fetchBatches(selectedDeptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to remove member`);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Batch Management</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage batches and assign students and teachers.
            </p>
          </div>
          {selectedDeptId && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              Add Batch
            </Button>
          )}
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
        <div className="flex items-center gap-4 mb-6">
          <div className="w-64">
            <Label className="text-zinc-400 text-xs mb-1.5 block">College</Label>
            <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Select college" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {colleges.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Label className="text-zinc-400 text-xs mb-1.5 block">Department</Label>
            <Select
              value={selectedDeptId}
              onValueChange={setSelectedDeptId}
              disabled={!selectedCollegeId}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50">
                <SelectValue placeholder={selectedCollegeId ? 'Select department' : 'Select college first'} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Batches Table */}
        {!selectedDeptId ? (
          <div className="rounded-xl border border-zinc-800 p-12 text-center">
            <p className="text-zinc-500">Select a college and department to view batches.</p>
          </div>
        ) : batchLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-zinc-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Year</TableHead>
                  <TableHead className="text-zinc-400">Semester</TableHead>
                  <TableHead className="text-zinc-400">Students</TableHead>
                  <TableHead className="text-zinc-400">Teachers</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                      No batches found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id} className="border-zinc-800 hover:bg-zinc-900/50">
                      <TableCell className="font-medium text-white">{batch.name}</TableCell>
                      <TableCell className="text-zinc-400">{batch.year ?? '-'}</TableCell>
                      <TableCell className="text-zinc-400">{batch.semester ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {batch._count?.batchStudents ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                          {batch._count?.batchTeachers ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchBatchDetail(batch.id)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditBatch(batch)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteBatch(batch)}
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
        )}
      </div>

      {/* ─── Batch Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!detailBatch} onOpenChange={(open) => !open && setDetailBatch(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Batch: <span className="text-blue-400">{detailBatch?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Manage students and teachers in this batch.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-zinc-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : detailBatch ? (
            <Tabs defaultValue="students" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-zinc-900 border border-zinc-800 w-fit">
                <TabsTrigger value="students" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                  Students ({detailBatch.batchStudents?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="teachers" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                  Teachers ({detailBatch.batchTeachers?.length ?? 0})
                </TabsTrigger>
              </TabsList>

              {/* Students tab */}
              <TabsContent value="students" className="flex-1 overflow-y-auto mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-400">Enrolled students</span>
                  <Button
                    size="sm"
                    onClick={() => openAddMember(detailBatch.id, 'students')}
                    className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white text-xs"
                  >
                    Add Students
                  </Button>
                </div>
                {detailBatch.batchStudents?.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-6">No students assigned yet.</p>
                ) : (
                  <div className="space-y-1">
                    {detailBatch.batchStudents?.map((bs) => (
                      <div
                        key={bs.user.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors"
                      >
                        <div>
                          <span className="text-sm text-white">
                            {bs.user.name || bs.user.email}
                          </span>
                          {bs.user.name && (
                            <span className="text-xs text-zinc-500 ml-2">{bs.user.email}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(detailBatch.id, bs.user.id, 'students')}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Teachers tab */}
              <TabsContent value="teachers" className="flex-1 overflow-y-auto mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-400">Assigned teachers</span>
                  <Button
                    size="sm"
                    onClick={() => openAddMember(detailBatch.id, 'teachers')}
                    className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white text-xs"
                  >
                    Add Teachers
                  </Button>
                </div>
                {detailBatch.batchTeachers?.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-6">No teachers assigned yet.</p>
                ) : (
                  <div className="space-y-1">
                    {detailBatch.batchTeachers?.map((bt) => (
                      <div
                        key={bt.user.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors"
                      >
                        <div>
                          <span className="text-sm text-white">
                            {bt.user.name || bt.user.email}
                          </span>
                          {bt.user.name && (
                            <span className="text-xs text-zinc-500 ml-2">{bt.user.email}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(detailBatch.id, bt.user.id, 'teachers')}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}

          <Separator className="bg-zinc-800" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailBatch(null)} className="text-zinc-400 hover:text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Batch Dialog ──────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create a new batch in the selected department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-name" className="text-zinc-300">Name</Label>
              <Input
                id="batch-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. CS Batch 2024-A"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-year" className="text-zinc-300">Year</Label>
                <Input
                  id="batch-year"
                  type="number"
                  value={createYear}
                  onChange={(e) => setCreateYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-semester" className="text-zinc-300">Semester</Label>
                <Input
                  id="batch-semester"
                  type="number"
                  value={createSemester}
                  onChange={(e) => setCreateSemester(e.target.value)}
                  placeholder="e.g. 1"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleCreateBatch}
              disabled={!createName.trim() || createLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {createLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Batch Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!editBatch} onOpenChange={(open) => !open && setEditBatch(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update batch details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-batch-name" className="text-zinc-300">Name</Label>
              <Input
                id="edit-batch-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-batch-year" className="text-zinc-300">Year</Label>
                <Input
                  id="edit-batch-year"
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-batch-semester" className="text-zinc-300">Semester</Label>
                <Input
                  id="edit-batch-semester"
                  type="number"
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditBatch(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleEditBatch}
              disabled={!editName.trim() || editLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Batch Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteBatch} onOpenChange={(open) => !open && setDeleteBatch(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete <strong className="text-white">{deleteBatch?.name}</strong>?
              All student and teacher assignments will be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteBatch(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBatch}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Students/Teachers Dialog ─────────────────────────────────────── */}
      <Dialog open={!!addMemberType} onOpenChange={(open) => !open && setAddMemberType(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              Add {addMemberType === 'students' ? 'Students' : 'Teachers'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter email addresses separated by commas to add {addMemberType} to this batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-emails" className="text-zinc-300">Email Addresses</Label>
              <textarea
                id="member-emails"
                value={addMemberEmails}
                onChange={(e) => setAddMemberEmails(e.target.value)}
                placeholder="student1@example.com, student2@example.com"
                rows={4}
                className="w-full rounded-md bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-zinc-500">
                Separate multiple emails with commas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddMemberType(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={!addMemberEmails.trim() || addMemberLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {addMemberLoading ? 'Adding...' : `Add ${addMemberType === 'students' ? 'Students' : 'Teachers'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
