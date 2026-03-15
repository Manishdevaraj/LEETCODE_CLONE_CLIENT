import { useState, useEffect, useCallback } from 'react';
import { API_BASE, authFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions?: Permission[];
  pageAccess?: PageAccess[];
}

interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface PageAccess {
  id: string;
  code: string;
  name: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allPageAccess, setAllPageAccess] = useState<PageAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit dialog
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Permissions dialog
  const [permRole, setPermRole] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);

  // Delete confirmation
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchRoles = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/roles`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    }
  }, []);

  const fetchPermissionsAndPages = useCallback(async () => {
    try {
      const [permRes, pageRes] = await Promise.all([
        authFetch(`${API_BASE}/permissions`),
        authFetch(`${API_BASE}/page-access`),
      ]);
      if (!permRes.ok) throw new Error('Failed to fetch permissions');
      if (!pageRes.ok) throw new Error('Failed to fetch page access');
      setAllPermissions(await permRes.json());
      setAllPageAccess(await pageRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchRoles(), fetchPermissionsAndPages()]).finally(() =>
      setLoading(false)
    );
  }, [fetchRoles, fetchPermissionsAndPages]);

  // ─── Create Role ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create role');
      }
      setCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Edit Role ────────────────────────────────────────────────────────────

  const openEditDialog = (role: Role) => {
    setEditRole(role);
    setEditName(role.name);
    setEditDesc(role.description ?? '');
  };

  const handleEdit = async () => {
    if (!editRole || !editName.trim()) return;
    setEditLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/roles/${editRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update role');
      }
      setEditRole(null);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Delete Role ──────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteRole) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/roles/${deleteRole.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete role');
      }
      setDeleteRole(null);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Permissions Dialog ───────────────────────────────────────────────────

  const openPermDialog = async (role: Role) => {
    setPermRole(role);
    setPermLoading(true);
    try {
      // Fetch role details to get current permissions and page access
      const res = await authFetch(`${API_BASE}/roles/${role.id}`);
      if (!res.ok) throw new Error('Failed to fetch role details');
      const data: Role = await res.json();
      setSelectedPermIds(new Set((data.permissions ?? []).map((p) => p.id)));
      setSelectedPageIds(new Set((data.pageAccess ?? []).map((p) => p.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role details');
      setPermRole(null);
    } finally {
      setPermLoading(false);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageAccess = (id: string) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!permRole) return;
    setPermSaving(true);
    try {
      const [permRes, pageRes] = await Promise.all([
        authFetch(`${API_BASE}/roles/${permRole.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionIds: Array.from(selectedPermIds) }),
        }),
        authFetch(`${API_BASE}/roles/${permRole.id}/page-access`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageAccessIds: Array.from(selectedPageIds) }),
        }),
      ]);
      if (!permRes.ok) throw new Error('Failed to update permissions');
      if (!pageRes.ok) throw new Error('Failed to update page access');
      setPermRole(null);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setPermSaving(false);
    }
  };

  // ─── Group permissions by category ────────────────────────────────────────

  const permissionsByCategory = allPermissions.reduce<Record<string, Permission[]>>(
    (acc, perm) => {
      const cat = perm.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    },
    {}
  );

  // ─── Render ───────────────────────────────────────────────────────────────

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
            <h1 className="text-2xl font-bold text-white">Role Management</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage roles, permissions, and page access for your organization.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
          >
            Create Role
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

        {/* Roles Table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Description</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={4} className="text-center text-zinc-500 py-12">
                    No roles found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableCell className="font-medium text-white">{role.name}</TableCell>
                    <TableCell className="text-zinc-400">
                      {role.description || <span className="text-zinc-600 italic">No description</span>}
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                          System
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                          Custom
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPermDialog(role)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          Permissions
                        </Button>
                        {!role.isSystem && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(role)}
                              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteRole(role)}
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
      </div>

      {/* ─── Create Role Dialog ────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a new role to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name" className="text-zinc-300">Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. COORDINATOR"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-desc" className="text-zinc-300">Description</Label>
              <Input
                id="create-desc"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Optional description"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createName.trim() || createLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {createLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Role Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update role details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-zinc-300">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc" className="text-zinc-300">Description</Label>
              <Input
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditRole(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editName.trim() || editLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={!!deleteRole} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete the role <strong className="text-white">{deleteRole?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteRole(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Permissions / Page Access Dialog ──────────────────────────────── */}
      <Dialog open={!!permRole} onOpenChange={(open) => !open && setPermRole(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Configure Access: <span className="text-blue-400">{permRole?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Assign permissions and page access for this role.
            </DialogDescription>
          </DialogHeader>

          {permLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-zinc-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <Tabs defaultValue="permissions" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-zinc-900 border border-zinc-800 w-fit">
                <TabsTrigger value="permissions" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                  Permissions
                </TabsTrigger>
                <TabsTrigger value="pages" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                  Page Access
                </TabsTrigger>
              </TabsList>

              <TabsContent value="permissions" className="flex-1 overflow-y-auto pr-2 mt-4">
                <div className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={selectedPermIds.has(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                              className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <div>
                              <span className="text-sm text-white">{perm.name}</span>
                              <span className="text-xs text-zinc-500 ml-2">({perm.code})</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <Separator className="mt-4 bg-zinc-800" />
                    </div>
                  ))}
                  {allPermissions.length === 0 && (
                    <p className="text-zinc-500 text-sm text-center py-8">No permissions available.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pages" className="flex-1 overflow-y-auto pr-2 mt-4">
                <div className="space-y-2">
                  {allPageAccess.map((page) => (
                    <label
                      key={page.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedPageIds.has(page.id)}
                        onCheckedChange={() => togglePageAccess(page.id)}
                        className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div>
                        <span className="text-sm text-white">{page.name}</span>
                        <span className="text-xs text-zinc-500 ml-2">({page.code})</span>
                      </div>
                    </label>
                  ))}
                  {allPageAccess.length === 0 && (
                    <p className="text-zinc-500 text-sm text-center py-8">No page access entries available.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="pt-4 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setPermRole(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={permSaving || permLoading}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
            >
              {permSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
