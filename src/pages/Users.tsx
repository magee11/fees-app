import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageLoader } from '../components/PageLoader';
import { UserFormDialog } from '../components/UserFormDialog';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useDeleteUser, useUpdateUser, useUsers } from '../hooks/queries/useUsers';
import { formatDateTime } from '../utils/date';
import { gradientForId } from '../utils/gradient';
import { ApiError } from '../api/client';
import type { UserDTO } from '../types/api';

export function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { data, isLoading, isError, refetch } = useUsers({ page: 1, limit: 50 });
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const [formTarget, setFormTarget] = useState<UserDTO | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);

  const users = data?.data ?? [];

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget._id);
      showToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete user');
    }
  }

  async function handleToggleActive(user: UserDTO) {
    try {
      await updateUser.mutateAsync({ id: user._id, payload: { isActive: !user.isActive } });
      showToast(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update user');
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Users</div>
          <div className="page-subtitle">Manage admin and staff accounts</div>
        </div>
        <div className="page-actions">
          <Button onClick={() => setFormTarget(null)}>
            <Plus size={15} />
            Add User
          </Button>
        </div>
      </div>

      <div className="card student-list-card">
        <div className="user-row user-row-header">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last Login</span>
          <span />
        </div>

        {isLoading && <PageLoader label="Loading users…" compact />}
        {isError && (
          <div className="empty-state">
            Couldn&apos;t load users.{' '}
            <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !isError && users.length === 0 && <div className="empty-state">No users yet.</div>}

        {users.map((u) => {
          const isSelf = u._id === currentUser?._id;
          return (
            <div key={u._id} className="user-row">
              <span className="student-cell-name">
                <Avatar name={u.name} gradient={gradientForId(u._id)} size={36} />
                <span>
                  <span className="student-name">{u.name}</span>
                  <span className="student-admission">{u.email}</span>
                </span>
              </span>
              <span data-label="Role" style={{ textTransform: 'capitalize' }}>{u.role}</span>
              <span data-label="Status">
                <button
                  className="badge-toggle"
                  onClick={() => handleToggleActive(u)}
                  disabled={isSelf}
                  title={isSelf ? "You can't deactivate your own account" : 'Toggle active status'}
                >
                  <Badge tone={u.isActive ? 'success' : 'neutral'} dot>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </button>
              </span>
              <span data-label="Last Login" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {formatDateTime(u.lastLoginAt)}
              </span>
              <span className="student-row-actions">
                <button className="icon-btn" style={{ width: 28, height: 28 }} aria-label="Edit user" onClick={() => setFormTarget(u)}>
                  <Pencil size={13} />
                </button>
                <button
                  className="icon-btn"
                  style={{ width: 28, height: 28 }}
                  aria-label="Delete user"
                  disabled={isSelf}
                  onClick={() => setDeleteTarget(u)}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <UserFormDialog open={formTarget !== undefined} user={formTarget ?? null} onClose={() => setFormTarget(undefined)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Delete ${deleteTarget?.name}? This can't be undone.`}
        confirmLabel="Delete"
        isBusy={deleteUser.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
