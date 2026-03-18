// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE, authFetch } from '@/lib/api';
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
  Dialog,
  DialogContent,
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
    case 'STUDENT':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function UserManagementPage() {
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
        const [rolesRes, collegesRes] = await Promise.all([
          authFetch(`${API_BASE}/roles`),
          authFetch(`${API_BASE}/colleges`),
        ]);
        if (rolesRes.ok) setRoles(await rolesRes.json());
        if (collegesRes.ok) setColleges(await collegesRes.json());
      } catch {
        // Non-critical; filters will just be empty
      }
    };
    fetchMeta();
  }, []);

  // ─── Fetch users when filters/page change ──────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter) params.set('roleId', roleFilter);
      if (collegeFilter) params.set('collegeId', collegeFilter);

      const res = await authFetch(`${API_BASE}/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: UsersResponse = await res.json();
      setUsers(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, collegeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Clear filters ─────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('');
    setCollegeFilter('');
    setPage(1);
  };

  const hasFilters = search || roleFilter || collegeFilter;

  // ─── Change Role ───────────────────────────────────────────────────────

  const openRoleDialog = (user: User) => {
    setRoleDialogUser(user);
    setSelectedRoleId(user.role.id);
  };

  const handleChangeRole = async () => {
    if (!roleDialogUser || !selectedRoleId) return;
    setRoleChanging(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/users/${roleDialogUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change role');
      }
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
      const res = await authFetch(`${API_BASE}/admin/users/${deleteUser.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete user');
      }
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

  // Assignable roles (exclude MASTER)
  const assignableRoles = roles.filter((r) => r.name !== 'MASTER');

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            View and manage all users across your organization.
          </p>
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
              {roles.map((role) => (
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

        {/* Users table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">College</TableHead>
                <TableHead className="text-zinc-400">Department</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                    No users found.
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
                      {user.department ?? (
                        <span className="text-zinc-600 italic">N/A</span>
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
              Showing {startItem}-{endItem} of {total} users
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
            <AlertDialogTitle>Delete User</AlertDialogTitle>
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
