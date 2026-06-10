'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Trash2, UserPlus } from 'lucide-react';

import { DataTable, EmptyState, FilterBar, FormDrawer, LoadingState, StatusBadge } from '@/components/ui-library';

import { PageHeader } from '@/components/dashboard/page-header';
import { SettingsNav } from '@/components/settings/settings-nav';
import { Button } from '@/components/ui/button';
import {
  useAssignUserRoles,
  useCreateUser,
  useDeleteUser,
  useRoles,
  useUpdateUserStatus,
  useUsers
} from '@/hooks/settings/useSettings';

interface UserRow {
  id: string;
  workId: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  roles: Array<{ id: string; name: string }>;
  branch: { id: string; name: string } | null;
}

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-cream px-3 text-brown outline-none focus:border-orange dark:border-darkBorder dark:bg-darkCard dark:text-darkText';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange/10 text-orange transition hover:bg-orange/20"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function SettingsUsersPage() {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    status: ''
  });

  const usersQuery = useUsers(filters);
  const rolesQuery = useRoles({ page: 1, pageSize: 100 });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ workId: string; password: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    idNumber: '',
    roleId: ''
  });

  const createUser = useCreateUser();

  const users = (usersQuery.data?.data ?? []) as UserRow[];
  const roles = useMemo(
    () =>
      ((rolesQuery.data?.data ?? []) as Array<{ id: string; name: string }>).map((r) => ({
        id: r.id,
        name: r.name
      })),
    [rolesQuery.data],
  );

  function resetForm() {
    setForm({ firstName: '', lastName: '', email: '', idNumber: '', roleId: '' });
    setCreatedCreds(null);
    setErrorMessage(null);
  }

  function handleClose() {
    setDrawerOpen(false);
    resetForm();
  }

  async function handleCreate() {
    setErrorMessage(null);
    if (!form.firstName || !form.lastName || !form.email || !form.idNumber || !form.roleId) {
      setErrorMessage('All fields are required.');
      return;
    }
    try {
      const result = (await createUser.mutateAsync(form)) as { workId?: string };
      const workId = result?.workId ?? '';
      const password = form.idNumber.replace(/[-\s]/g, '').toLowerCase();
      setCreatedCreds({ workId, password });
      setForm({ firstName: '', lastName: '', email: '', idNumber: '', roleId: '' });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create user.');
    }
  }

  if (usersQuery.isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Manage user accounts, role assignments, and account status."
        actions={
          <Button onClick={() => { resetForm(); setDrawerOpen(true); }} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      <SettingsNav />

      <FilterBar
        filters={[
          {
            key: 'search',
            label: 'Search',
            type: 'search',
            value: filters.search
          },
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Suspended', value: 'suspended' },
            ],
          }
        ]}
        onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
      />

      <DataTable
        columns={[
          { key: 'workId', header: 'Work ID' },
          { key: 'fullName', header: 'Name' },
          { key: 'email', header: 'Email' },
          {
            key: 'role',
            header: 'Role',
            render: (row: UserRow) => row.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row: UserRow) => <StatusBadge status={row.status} />
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row: UserRow) => (
              <div className="flex flex-wrap gap-2">
                <RoleAssignButton userId={row.id} currentRole={row.role} allRoles={roles} />
                <StatusToggleButton userId={row.id} status={row.status} />
                <DeleteUserButton userId={row.id} fullName={row.fullName} onDeleted={() => usersQuery.refetch()} />
              </div>
            ),
          }
        ]}
        data={users}
        emptyState={
          <EmptyState
            icon={<UserPlus className="h-6 w-6" />}
            title="No users found"
            description="Adjust filters or add a user to get started."
          />
        }
      />

      {/* Add User Drawer */}
      <FormDrawer title="Add User" open={drawerOpen} onClose={handleClose}>
        {createdCreds ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-700 dark:bg-emerald-900/20">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                User created successfully!
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Share these login credentials with the user directly:
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-cream p-4 dark:border-darkBorder dark:bg-darkCard">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted dark:text-darkMuted">Work ID</p>
                <div className="mt-1 flex items-center">
                  <span className="font-mono text-lg font-bold text-orange">{createdCreds.workId}</span>
                  <CopyButton value={createdCreds.workId} />
                </div>
              </div>
              <div className="h-px bg-border dark:bg-darkBorder" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted dark:text-darkMuted">Initial Password</p>
                <div className="mt-1 flex items-center">
                  <span className="font-mono text-sm font-semibold text-brown dark:text-darkText">{createdCreds.password}</span>
                  <CopyButton value={createdCreds.password} />
                </div>
                <p className="mt-1 text-[11px] text-muted/70 dark:text-darkMuted/70">
                  ID number without dashes/spaces in lowercase. Ask user to change after first login.
                </p>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm text-muted dark:text-darkMuted">
                <span>First Name</span>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="e.g. Tawanda"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1.5 text-sm text-muted dark:text-darkMuted">
                <span>Last Name</span>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="e.g. Moyo"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block space-y-1.5 text-sm text-muted dark:text-darkMuted">
              <span>Email Address</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@company.co.zw"
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5 text-sm text-muted dark:text-darkMuted">
              <span>ID Number</span>
              <input
                value={form.idNumber}
                onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
                placeholder="e.g. 63-123456-A-78"
                className={inputClass}
              />
              <p className="text-[11px] text-muted/70 dark:text-darkMuted/70">
                Initial password = ID number without dashes/spaces in lowercase.
              </p>
            </label>

            <label className="block space-y-1.5 text-sm text-muted dark:text-darkMuted">
              <span>Role</span>
              <select
                value={form.roleId}
                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select a role…</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {errorMessage}
              </p>
            ) : null}

            <Button
              onClick={handleCreate}
              disabled={createUser.isPending}
              className="w-full"
            >
              {createUser.isPending ? 'Creating…' : 'Create User'}
            </Button>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}

function RoleAssignButton({
  userId,
  currentRole,
  allRoles,
}: {
  userId: string;
  currentRole: string;
  allRoles: Array<{ id: string; name: string }>;
}) {
  const assignRole = useAssignUserRoles(userId);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(currentRole);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => { setSelected(currentRole); setEditing(true); }}>
        Role
      </Button>
      <FormDrawer title="Change Role" open={editing} onClose={() => setEditing(false)}>
        <div className="space-y-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-cream px-3 text-brown outline-none focus:border-orange dark:border-darkBorder dark:bg-darkCard dark:text-darkText"
          >
            {allRoles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <Button
            onClick={async () => {
              await assignRole.mutateAsync({ role: selected });
              setEditing(false);
            }}
            disabled={assignRole.isPending}
          >
            {assignRole.isPending ? 'Saving…' : 'Save Role'}
          </Button>
        </div>
      </FormDrawer>
    </>
  );
}

function StatusToggleButton({ userId, status }: { userId: string; status: string }) {
  const updateStatus = useUpdateUserStatus(userId);
  const [open, setOpen] = useState(false);

  const statusOptions: Array<{ value: string; label: string; className: string }> = [
    { value: 'active', label: 'Set Active', className: 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20' },
    { value: 'inactive', label: 'Deactivate', className: 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20' },
    { value: 'suspended', label: 'Suspend', className: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' },
  ].filter((opt) => opt.value !== status);

  async function handleStatusChange(newStatus: string) {
    await updateStatus.mutateAsync({ status: newStatus });
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        disabled={updateStatus.isPending}
        className={
          status === 'active'
            ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
            : status === 'suspended'
              ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'
              : 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400'
        }
      >
        {updateStatus.isPending ? '…' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-white shadow-card-hover dark:border-darkBorder dark:bg-[#1a0800]">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition ${opt.className}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeleteUserButton({
  userId,
  fullName,
  onDeleted,
}: {
  userId: string;
  fullName: string;
  onDeleted: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const deleteUser = useDeleteUser();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteUser.mutateAsync(userId);
      setConfirm(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => { setError(null); setConfirm(true); }}
        className="border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <FormDrawer title="Delete User" open={confirm} onClose={() => setConfirm(false)}>
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">This action cannot be undone</p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              You are about to permanently delete <span className="font-semibold">{fullName}</span>.
              Their account and all login access will be removed.
            </p>
          </div>
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setConfirm(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteUser.isPending}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              {deleteUser.isPending ? 'Deleting…' : 'Delete User'}
            </Button>
          </div>
        </div>
      </FormDrawer>
    </>
  );
}
