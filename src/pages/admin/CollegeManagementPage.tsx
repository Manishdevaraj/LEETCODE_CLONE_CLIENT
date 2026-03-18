import { useState, useEffect, useCallback } from 'react';
import { API_BASE, authFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface College {
  id: string;
  name: string;
  code: string;
  location: string | null;
  _count?: { departments: number };
}

interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  _count?: { batches: number };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CollegeManagementPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded college -> departments
  const [expandedCollegeId, setExpandedCollegeId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // Create college dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit college dialog
  const [editCollege, setEditCollege] = useState<College | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete college dialog
  const [deleteCollege, setDeleteCollege] = useState<College | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create department dialog
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [createDeptCollegeId, setCreateDeptCollegeId] = useState<string | null>(null);
  const [createDeptName, setCreateDeptName] = useState('');
  const [createDeptCode, setCreateDeptCode] = useState('');
  const [createDeptLoading, setCreateDeptLoading] = useState(false);

  // Edit department dialog
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptLoading, setEditDeptLoading] = useState(false);

  // Delete department dialog
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [deleteDeptLoading, setDeleteDeptLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchColleges = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/colleges`);
      if (!res.ok) throw new Error('Failed to fetch colleges');
      const data = await res.json();
      setColleges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch colleges');
    }
  }, []);

  const fetchDepartments = useCallback(async (collegeId: string) => {
    setDeptLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/colleges/${collegeId}/departments`);
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
    } finally {
      setDeptLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColleges().finally(() => setLoading(false));
  }, [fetchColleges]);

  const toggleExpand = (collegeId: string) => {
    if (expandedCollegeId === collegeId) {
      setExpandedCollegeId(null);
      setDepartments([]);
    } else {
      setExpandedCollegeId(collegeId);
      fetchDepartments(collegeId);
    }
  };

  // ─── College CRUD ─────────────────────────────────────────────────────────

  const handleCreateCollege = async () => {
    if (!createName.trim() || !createCode.trim()) return;
    setCreateLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/colleges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          code: createCode.trim(),
          location: createLocation.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create college');
      }
      setCreateOpen(false);
      setCreateName('');
      setCreateCode('');
      setCreateLocation('');
      await fetchColleges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create college');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditCollege = (college: College) => {
    setEditCollege(college);
    setEditName(college.name);
    setEditCode(college.code);
    setEditLocation(college.location ?? '');
  };

  const handleEditCollege = async () => {
    if (!editCollege || !editName.trim() || !editCode.trim()) return;
    setEditLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/colleges/${editCollege.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim(),
          location: editLocation.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update college');
      }
      setEditCollege(null);
      await fetchColleges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update college');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCollege = async () => {
    if (!deleteCollege) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/colleges/${deleteCollege.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete college');
      }
      if (expandedCollegeId === deleteCollege.id) {
        setExpandedCollegeId(null);
        setDepartments([]);
      }
      setDeleteCollege(null);
      await fetchColleges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete college');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Department CRUD ──────────────────────────────────────────────────────

  const openCreateDept = (collegeId: string) => {
    setCreateDeptCollegeId(collegeId);
    setCreateDeptOpen(true);
    setCreateDeptName('');
    setCreateDeptCode('');
  };

  const handleCreateDept = async () => {
    if (!createDeptCollegeId || !createDeptName.trim() || !createDeptCode.trim()) return;
    setCreateDeptLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/colleges/${createDeptCollegeId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createDeptName.trim(),
          code: createDeptCode.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create department');
      }
      setCreateDeptOpen(false);
      setCreateDeptName('');
      setCreateDeptCode('');
      await Promise.all([fetchColleges(), fetchDepartments(createDeptCollegeId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setCreateDeptLoading(false);
    }
  };

  const openEditDept = (dept: Department) => {
    setEditDept(dept);
    setEditDeptName(dept.name);
    setEditDeptCode(dept.code);
  };

  const handleEditDept = async () => {
    if (!editDept || !editDeptName.trim() || !editDeptCode.trim()) return;
    setEditDeptLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/departments/${editDept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDeptName.trim(),
          code: editDeptCode.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update department');
      }
      setEditDept(null);
      if (expandedCollegeId) {
        await Promise.all([fetchColleges(), fetchDepartments(expandedCollegeId)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update department');
    } finally {
      setEditDeptLoading(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deleteDept) return;
    setDeleteDeptLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/departments/${deleteDept.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete department');
      }
      setDeleteDept(null);
      if (expandedCollegeId) {
        await Promise.all([fetchColleges(), fetchDepartments(expandedCollegeId)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    } finally {
      setDeleteDeptLoading(false);
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
            <h1 className="text-2xl font-bold text-white">College Management</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage colleges and their departments.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
          >
            Add College
          </Button>
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

        {/* Colleges Table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 w-8"></TableHead>
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Code</TableHead>
                <TableHead className="text-zinc-400">Location</TableHead>
                <TableHead className="text-zinc-400">Departments</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                    No colleges found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                colleges.map((college) => (
                  <>
                    <TableRow
                      key={college.id}
                      className="border-zinc-800 hover:bg-zinc-900/50 cursor-pointer"
                      onClick={() => toggleExpand(college.id)}
                    >
                      <TableCell className="text-zinc-500 w-8">
                        <svg
                          className={`h-4 w-4 transition-transform ${expandedCollegeId === college.id ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </TableCell>
                      <TableCell className="font-medium text-white">{college.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                          {college.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {college.location || <span className="text-zinc-600 italic">No location</span>}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {college._count?.departments ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCollege(college)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCollege(college)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded departments section */}
                    {expandedCollegeId === college.id && (
                      <TableRow key={`${college.id}-dept`} className="border-zinc-800 bg-zinc-900/30">
                        <TableCell colSpan={6} className="p-0">
                          <div className="px-8 py-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-semibold text-zinc-300">
                                Departments in {college.name}
                              </h3>
                              <Button
                                size="sm"
                                onClick={() => openCreateDept(college.id)}
                                className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white text-xs"
                              >
                                Add Department
                              </Button>
                            </div>

                            {deptLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <svg className="animate-spin h-5 w-5 text-zinc-500" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              </div>
                            ) : departments.length === 0 ? (
                              <p className="text-zinc-500 text-sm text-center py-6">
                                No departments yet. Add one to get started.
                              </p>
                            ) : (
                              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                      <TableHead className="text-zinc-400">Name</TableHead>
                                      <TableHead className="text-zinc-400">Code</TableHead>
                                      <TableHead className="text-zinc-400">Batches</TableHead>
                                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {departments.map((dept) => (
                                      <TableRow key={dept.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                        <TableCell className="font-medium text-white">{dept.name}</TableCell>
                                        <TableCell>
                                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                                            {dept.code}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-400">
                                          {dept._count?.batches ?? 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => openEditDept(dept)}
                                              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setDeleteDept(dept)}
                                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Create College Dialog ────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New College</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create a new college in your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="college-name" className="text-zinc-300">Name</Label>
              <Input
                id="college-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. MIT College of Engineering"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college-code" className="text-zinc-300">Code</Label>
              <Input
                id="college-code"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
                placeholder="e.g. MITCOE"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college-location" className="text-zinc-300">Location</Label>
              <Input
                id="college-location"
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                placeholder="e.g. Pune, Maharashtra"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollege}
              disabled={!createName.trim() || !createCode.trim() || createLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {createLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit College Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!editCollege} onOpenChange={(open) => !open && setEditCollege(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit College</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update college details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-college-name" className="text-zinc-300">Name</Label>
              <Input
                id="edit-college-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-college-code" className="text-zinc-300">Code</Label>
              <Input
                id="edit-college-code"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-college-location" className="text-zinc-300">Location</Label>
              <Input
                id="edit-college-location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditCollege(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleEditCollege}
              disabled={!editName.trim() || !editCode.trim() || editLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete College Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!deleteCollege} onOpenChange={(open) => !open && setDeleteCollege(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete College</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete <strong className="text-white">{deleteCollege?.name}</strong>?
              This will also delete all departments and batches under it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteCollege(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCollege}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? 'Deleting...' : 'Delete College'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Department Dialog ─────────────────────────────────────────── */}
      <Dialog open={createDeptOpen} onOpenChange={setCreateDeptOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create a new department in this college.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name" className="text-zinc-300">Name</Label>
              <Input
                id="dept-name"
                value={createDeptName}
                onChange={(e) => setCreateDeptName(e.target.value)}
                placeholder="e.g. Computer Science"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-code" className="text-zinc-300">Code</Label>
              <Input
                id="dept-code"
                value={createDeptCode}
                onChange={(e) => setCreateDeptCode(e.target.value)}
                placeholder="e.g. CS"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDeptOpen(false)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleCreateDept}
              disabled={!createDeptName.trim() || !createDeptCode.trim() || createDeptLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {createDeptLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Department Dialog ───────────────────────────────────────────── */}
      <Dialog open={!!editDept} onOpenChange={(open) => !open && setEditDept(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update department details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dept-name" className="text-zinc-300">Name</Label>
              <Input
                id="edit-dept-name"
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-code" className="text-zinc-300">Code</Label>
              <Input
                id="edit-dept-code"
                value={editDeptCode}
                onChange={(e) => setEditDeptCode(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDept(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleEditDept}
              disabled={!editDeptName.trim() || !editDeptCode.trim() || editDeptLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {editDeptLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Department Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!deleteDept} onOpenChange={(open) => !open && setDeleteDept(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete <strong className="text-white">{deleteDept?.name}</strong>?
              This will also delete all batches under it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDept(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDept}
              disabled={deleteDeptLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteDeptLoading ? 'Deleting...' : 'Delete Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
