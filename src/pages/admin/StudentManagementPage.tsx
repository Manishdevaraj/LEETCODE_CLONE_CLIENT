import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/user.service';
import { collegeService } from '@/services/college.service';
import { batchService } from '@/services/batch.service';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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

interface BatchInfo {
  id: string;
  name: string;
  year: number;
  department: { id: string; name: string };
}

interface Student {
  id: string;
  name: string;
  email: string;
  department: string | null;
  createdAt: string;
  role: { id: string; name: string };
  college: { id: string; name: string } | null;
  batchStudents: { batch: BatchInfo }[];
}

interface StudentsResponse {
  data: Student[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function StudentManagementPage() {
  const navigate = useNavigate();

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign Batch dialog
  const [assignStudent, setAssignStudent] = useState<Student | null>(null);
  const [assignCollegeId, setAssignCollegeId] = useState('');
  const [assignDepartments, setAssignDepartments] = useState<Department[]>([]);
  const [assignDeptId, setAssignDeptId] = useState('');
  const [assignBatches, setAssignBatches] = useState<{ id: string; name: string; year: number }[]>([]);
  const [assignBatchId, setAssignBatchId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Debounce search ────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ─── Fetch colleges on mount ──────────────────────────────────────────

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setColleges(await collegeService.getAll() as unknown as College[]);
      } catch {
        // Non-critical; filter will just be empty
      }
    };
    fetchMeta();
  }, []);

  // ─── Fetch students when filters/page change ─────────────────────────

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        collegeId: collegeFilter || undefined,
        batchId: batchFilter || undefined,
        userType: 'student',
      });
      setStudents((data.data ?? []) as unknown as Student[]);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, collegeFilter, batchFilter]);

  // ─── Clear filters ─────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCollegeFilter('');
    setBatchFilter('');
    setPage(1);
  };

  const hasFilters = search || collegeFilter || batchFilter;

  // ─── Delete Student ───────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteStudent) return;
    setDeleting(true);
    try {
      await userService.delete(deleteStudent.id);
      setDeleteStudent(null);
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Assign Batch: cascading fetch ─────────────────────────────────────

  const openAssignDialog = (student: Student) => {
    setAssignStudent(student);
    setAssignCollegeId(student.college?.id || '');
    setAssignDepartments([]);
    setAssignDeptId('');
    setAssignBatches([]);
    setAssignBatchId('');
    // If student already has a college, fetch its departments
    if (student.college?.id) {
      fetchDepartments(student.college.id);
    }
  };

  const fetchDepartments = async (collegeId: string) => {
    try {
      setAssignDepartments(await collegeService.getDepartments(collegeId) as unknown as Department[]);
    } catch {
      setAssignDepartments([]);
    }
  };

  const fetchBatches = async (departmentId: string) => {
    try {
      setAssignBatches(await batchService.getByDepartment(departmentId) as unknown as { id: string; name: string; year: number }[]);
    } catch {
      setAssignBatches([]);
    }
  };

  const handleCollegeChange = (collegeId: string) => {
    setAssignCollegeId(collegeId);
    setAssignDeptId('');
    setAssignBatches([]);
    setAssignBatchId('');
    if (collegeId) fetchDepartments(collegeId);
    else setAssignDepartments([]);
  };

  const handleDeptChange = (deptId: string) => {
    setAssignDeptId(deptId);
    setAssignBatchId('');
    if (deptId) fetchBatches(deptId);
    else setAssignBatches([]);
  };

  const handleAssignBatch = async () => {
    if (!assignStudent || !assignBatchId) return;
    setAssigning(true);
    try {
      await batchService.addStudents(assignBatchId, { userIds: [assignStudent.id] } as Parameters<typeof batchService.addStudents>[1]);
      setAssignStudent(null);
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign batch');
    } finally {
      setAssigning(false);
    }
  };

  // ─── Remove from Batch ──────────────────────────────────────────────────

  const handleRemoveBatch = async (studentId: string, batchId: string) => {
    try {
      await batchService.removeStudent(batchId, studentId);
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from batch');
    }
  };

  // ─── Pagination helpers ────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Student Management</h1>
            <p className="text-sm text-zinc-400 mt-1">
              View and manage student users across your organization.
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/bulk-upload')}
            className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
          >
            Bulk Upload Students
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />

          <Select
            value={collegeFilter}
            onValueChange={(val) => {
              setCollegeFilter(val === 'all' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52 bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="All Colleges" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all" className="text-zinc-300">
                All Colleges
              </SelectItem>
              {colleges.map((college) => (
                <SelectItem key={college.id} value={college.id} className="text-zinc-300">
                  {college.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by batch..."
            value={batchFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setPage(1);
            }}
            className="w-44 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Students table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">College</TableHead>
                <TableHead className="text-zinc-400">Department</TableHead>
                <TableHead className="text-zinc-400">Batch</TableHead>
                <TableHead className="text-zinc-400">Joined</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                    <svg
                      className="animate-spin h-6 w-6 text-zinc-500 mx-auto"
                      viewBox="0 0 24 24"
                    >
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
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const batches = student.batchStudents || [];
                  return (
                    <TableRow
                      key={student.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          {student.name}
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-400 border-green-500/20"
                          >
                            STUDENT
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">{student.email}</TableCell>
                      <TableCell className="text-zinc-400">
                        {student.college?.name ?? (
                          <span className="text-zinc-600 italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {student.department ?? (
                          <span className="text-zinc-600 italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {batches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {batches.map((bs) => (
                              <Badge
                                key={bs.batch.id}
                                variant="secondary"
                                className="bg-blue-500/10 text-blue-400 border-blue-500/20 cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
                                title="Click to remove from batch"
                                onClick={() => handleRemoveBatch(student.id, bs.batch.id)}
                              >
                                {bs.batch.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-600 italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {formatDate(student.createdAt)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAssignDialog(student)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          Assign Batch
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteStudent(student)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-400">
              Showing {startItem}-{endItem} of {total} students
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40"
              >
                Previous
              </Button>
              <span className="text-sm text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteStudent}
        onOpenChange={(open) => !open && setDeleteStudent(null)}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure? This will permanently delete the student{' '}
              <strong className="text-white">{deleteStudent?.name}</strong> (
              {deleteStudent?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Student'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Assign Batch Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!assignStudent}
        onOpenChange={(open) => !open && setAssignStudent(null)}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Batch</DialogTitle>
            <p className="text-sm text-zinc-400 mt-1">
              Assign <strong className="text-white">{assignStudent?.name}</strong> to a batch.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* College */}
            <div className="space-y-2">
              <Label className="text-zinc-300">College</Label>
              <Select value={assignCollegeId} onValueChange={handleCollegeChange}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
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

            {/* Department */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Department</Label>
              <Select
                value={assignDeptId}
                onValueChange={handleDeptChange}
                disabled={!assignCollegeId}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50">
                  <SelectValue placeholder={assignCollegeId ? 'Select department' : 'Select college first'} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {assignDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-zinc-300">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Batch</Label>
              <Select
                value={assignBatchId}
                onValueChange={setAssignBatchId}
                disabled={!assignDeptId}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50">
                  <SelectValue placeholder={assignDeptId ? 'Select batch' : 'Select department first'} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {assignBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-zinc-300">
                      {b.name} ({b.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignStudent(null)}
              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignBatch}
              disabled={!assignBatchId || assigning}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
