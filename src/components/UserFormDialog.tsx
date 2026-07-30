import { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { useCreateUser, useUpdateUser } from '../hooks/queries/useUsers';
import { ApiError } from '../api/client';
import type { Role, UserDTO } from '../types/api';

interface UserFormDialogProps {
  open: boolean;
  user: UserDTO | null;
  onClose: () => void;
}

export function UserFormDialog({ open, user, onClose }: UserFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isEditMode = !!user;
  const isSubmitting = createUser.isPending || updateUser.isPending;

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setPassword('');
    setRole(user?.role ?? 'staff');
    setError(null);
  }, [user, open]);

  async function handleSave() {
    if (!name.trim() || (!isEditMode && (!email.trim() || password.length < 8))) return;
    setError(null);
    try {
      if (isEditMode && user) {
        await updateUser.mutateAsync({ id: user._id, payload: { name, role } });
        showToast(`${name} updated`);
      } else {
        await createUser.mutateAsync({ name, email, password, role });
        showToast(`${name} added`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Dialog open={open} title={isEditMode ? 'Edit User' : 'Add User'} onClose={onClose}>
      <div className="form-grid">
        {error && <div className="login-error form-field full">{error}</div>}

        <div className="form-field full">
          <label className="form-label">Full Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-field full">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            disabled={isEditMode}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@school.com"
          />
        </div>
        {!isEditMode && (
          <div className="form-field full">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
        )}
        <div className="form-field full">
          <label className="form-label">Role</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="dialog-actions">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </Dialog>
  );
}
