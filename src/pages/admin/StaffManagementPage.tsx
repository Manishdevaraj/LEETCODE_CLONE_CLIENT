import { useState, useEffect, useCallback, useRef } from 'react';
import { userService } from '@/services/user.service';
import { roleService } from '@/services/role.service';
import { collegeService } from '@/services/college.service';
import { bulkUploadService } from '@/services/bulk-upload.service';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
  isSystem?: boolean;
}

interface College {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string | null;
  createdAt: string;
  role: { id: string; name: string };
  college: { id: string; name: string } | null;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

interface UploadResultRow {
  row: number;
  email: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

interface UploadResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  details: UploadResultRow[];
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

function roleBadgeClass(roleName: string): string {
  switch (roleName) {
    case 'MASTER':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'ADMIN':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'TEACHER':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function StaffManagementPage() {
  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Staff dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    collegeId: '',
  });
  const [creating, setCreating] = useState(false);

  // Bulk Upload dialog
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResult, setBulkResult] = useState<UploadResult | null>(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Change Role dialog
  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleChanging, setRoleChanging] = useState(false);

  // Delete dialog
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // ─── Fetch roles & colleges on mount ────────────────────────────────────

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [rolesData, collegesData] = await Promise.all([
          roleService.getAll(),
          collegeService.getAll(),
        ]);
        setRoles(rolesData as unknown as Role[]);
        setColleges(collegesData as unknown as College[]);
      } catch {
        // Non-critical; filters will just be empty
      }
    };
    fetchMeta();
  }, []);

  // ─── Fetch staff users when filters/page change ────────────────────────

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        roleId: roleFilter || undefined,
        collegeId: collegeFilter || undefined,
        userType: 'staff',
      });
      setUsers((data.data ?? []) as unknown as User[]);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, roleFilter, collegeFilter]);

  // ─── Clear filters ─────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('');
    setCollegeFilter('');
    setPage(1);
  };

  const hasFilters = search || roleFilter || collegeFilter;

  // ─── Assignable roles (exclude MASTER and STUDENT) ──────────────────────

  const staffRoles = roles.filter((r) => r.name !== 'MASTER' && r.name !== 'STUDENT');

  // ─── Create Staff ───────────────────────────────────────────────────────

  const openCreateDialog = () => {
    setCreateForm({ name: '', email: '', password: '', roleId: '', collegeId: '' });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.roleId) return;
    setCreating(true);
    try {
      const payload: Record<string, string> = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        roleId: createForm.roleId,
      };
      if (createForm.collegeId) payload.collegeId = createForm.collegeId;

      await userService.create(payload as Parameters<typeof userService.create>[0]);
      setCreateOpen(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff user');
    } finally {
      setCreating(false);
    }
  };

  // ─── Bulk Upload ────────────────────────────────────────────────────────

  const handleBulkDownloadTemplate = async () => {
    setBulkDownloading(true);
    try {
      const blob = await bulkUploadService.downloadStaffTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'staff-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleBulkFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Please select a .csv or .xlsx file');
      return;
    }
    setBulkFile(selectedFile);
    setBulkResult(null);
    setError(null);
  }, []);

  const handleBulkDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setBulkDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleBulkFileSelect(droppedFile);
  }, [handleBulkFileSelect]);

  const handleBulkDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setBulkDragOver(true);
  }, []);

  const handleBulkDragLeave = useCallback(() => {
    setBulkDragOver(false);
  }, []);

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkProgress(10);
    setError(null);
    try {
      setBulkProgress(30);
      const data = await bulkUploadService.uploadStaff(bulkFile);
      setBulkProgress(80);
      setBulkResult(data as unknown as UploadResult);
      setBulkProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const resetBulkUpload = () => {
    setBulkFile(null);
    setBulkResult(null);
    setBulkProgress(0);
    setError(null);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
  };

  const closeBulkDialog = () => {
    setBulkOpen(false);
    resetBulkUpload();
    if (bulkResult) fetchUsers();
  };

  // ─── Change Role ───────────────────────────────────────────────────────

  const openRoleDialog = (user: User) => {
    setRoleDialogUser(user);
    setSelectedRoleId(user.role.id);
  };

  const handleChangeRole = async () => {
    if (!roleDialogUser || !selectedRoleId) return;
    setRoleChanging(true);
    try {
      await userService.changeRole(roleDialogUser.id, { roleId: selectedRoleId });
      setRoleDialogUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setRoleChanging(false);
    }
  };

  // ─── Delete User ───────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await userService.delete(deleteUser.id);
      setDeleteUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Pagination helpers ────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Assignable roles for change-role dialog (exclude MASTER)
  const assignableRoles = roles.filter((r) => r.name !== 'MASTER');

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Staff Management</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage all non-student staff users across your organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setBulkOpen(true)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Bulk Upload
            </Button>
            <Button
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Staff
            </Button>
          </div>
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
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val === 'all' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44 bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all" className="text-zinc-300">
                All Roles
              </SelectItem>
              {staffRoles.map((role) => (
                <SelectItem key={role.id} value={role.id} className="text-zinc-300">
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

        {/* Staff table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">College</TableHead>
                <TableHead className="text-zinc-400">Joined</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
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
              ) : users.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                    No staff users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <TableCell className="font-medium text-white">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-zinc-400">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={roleBadgeClass(user.role.name)}
                      >
                        {user.role.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {user.college?.name ?? (
                        <span className="text-zinc-600 italic">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role.name !== 'MASTER' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              Change Role
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteUser(user)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-400">
              Showing {startItem}-{endItem} of {total} staff users
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

      {/* ─── Create Staff Dialog ──────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Staff User</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a new staff member to the platform. They will receive their login
              credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Name</Label>
              <Input
                placeholder="Full name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Password</Label>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Role</Label>
              <Select
                value={createForm.roleId}
                onValueChange={(val) =>
                  setCreateForm((f) => ({ ...f, roleId: val }))
                }
              >
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {staffRoles.map((role) => (
                    <SelectItem
                      key={role.id}
                      value={role.id}
                      className="text-zinc-300"
                    >
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">
                College <span className="text-zinc-600">(optional)</span>
              </Label>
              <Select
                value={createForm.collegeId}
                onValueChange={(val) =>
                  setCreateForm((f) => ({ ...f, collegeId: val === 'none' ? '' : val }))
                }
              >
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="No college" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="none" className="text-zinc-300">
                    No college
                  </SelectItem>
                  {colleges.map((college) => (
                    <SelectItem
                      key={college.id}
                      value={college.id}
                      className="text-zinc-300"
                    >
                      {college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !createForm.name ||
                !createForm.email ||
                !createForm.password ||
                !createForm.roleId ||
                creating
              }
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Staff'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Upload Dialog ───────────────────────────────────────────────── */}
      <Dialog open={bulkOpen} onOpenChange={(open) => !open && closeBulkDialog()}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Upload Staff</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Upload a CSV or Excel file to create staff accounts in bulk.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Download template */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Download the template to get started.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDownloadTemplate}
                disabled={bulkDownloading}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {bulkDownloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                  </>
                )}
              </Button>
            </div>

            {!bulkResult && (
              <>
                {/* Drag and drop zone */}
                <div
                  onDrop={handleBulkDrop}
                  onDragOver={handleBulkDragOver}
                  onDragLeave={handleBulkDragLeave}
                  onClick={() => bulkFileInputRef.current?.click()}
                  className={`
                    relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
                    ${bulkDragOver
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => handleBulkFileSelect(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-full p-3 ${bulkDragOver ? 'bg-blue-500/10' : 'bg-zinc-800'}`}>
                      <svg className={`h-8 w-8 ${bulkDragOver ? 'text-blue-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-300">
                        {bulkFile ? (
                          <span className="text-blue-400 font-medium">{bulkFile.name}</span>
                        ) : (
                          <>
                            <span className="text-blue-400 font-medium">Drop your file here</span>
                            {' '}or click to browse
                          </>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Supports .csv and .xlsx files
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload progress & button */}
                {bulkFile && (
                  <div className="space-y-4">
                    {bulkUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Uploading...</span>
                          <span className="text-zinc-400">{bulkProgress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-300"
                            style={{ width: `${bulkProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleBulkUpload}
                        disabled={bulkUploading}
                        className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
                      >
                        {bulkUploading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          'Upload File'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={resetBulkUpload}
                        disabled={bulkUploading}
                        className="text-zinc-400 hover:text-white"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Results summary */}
            {bulkResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Total</p>
                    <p className="text-xl font-bold text-white mt-1">{bulkResult.total}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-center">
                    <p className="text-xs text-green-500 uppercase tracking-wider">Created</p>
                    <p className="text-xl font-bold text-green-400 mt-1">{bulkResult.created}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-center">
                    <p className="text-xs text-amber-500 uppercase tracking-wider">Skipped</p>
                    <p className="text-xl font-bold text-amber-400 mt-1">{bulkResult.skipped}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-center">
                    <p className="text-xs text-red-500 uppercase tracking-wider">Errors</p>
                    <p className="text-xl font-bold text-red-400 mt-1">{bulkResult.errors.length}</p>
                  </div>
                </div>

                {/* Details table */}
                {bulkResult.details && bulkResult.details.length > 0 && (
                  <div className="rounded-xl border border-zinc-800 overflow-hidden max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                          <TableHead className="text-zinc-400">Row</TableHead>
                          <TableHead className="text-zinc-400">Email</TableHead>
                          <TableHead className="text-zinc-400">Status</TableHead>
                          <TableHead className="text-zinc-400">Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkResult.details.map((row, idx) => (
                          <TableRow key={idx} className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableCell className="text-zinc-400">{row.row}</TableCell>
                            <TableCell className="font-medium text-white">{row.email}</TableCell>
                            <TableCell>
                              {row.status === 'created' && (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                                  Created
                                </Badge>
                              )}
                              {row.status === 'skipped' && (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                                  Skipped
                                </Badge>
                              )}
                              {row.status === 'error' && (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                                  Error
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-zinc-400 text-sm">
                              {row.reason || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <Button
                  onClick={resetBulkUpload}
                  className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
                >
                  Upload Another File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Change Role Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={!!roleDialogUser}
        onOpenChange={(open) => !open && setRoleDialogUser(null)}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              Change Role for{' '}
              <span className="text-blue-400">{roleDialogUser?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-400">
              Current role:{' '}
              <Badge
                variant="secondary"
                className={roleBadgeClass(roleDialogUser?.role.name ?? '')}
              >
                {roleDialogUser?.role.name}
              </Badge>
            </p>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {assignableRoles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.id}
                    className="text-zinc-300"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setRoleDialogUser(null)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={
                !selectedRoleId ||
                selectedRoleId === roleDialogUser?.role.id ||
                roleChanging
              }
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {roleChanging ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff User</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure? This will permanently delete the user{' '}
              <strong className="text-white">{deleteUser?.name}</strong> (
              {deleteUser?.email}). This action cannot be undone.
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
              {deleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
