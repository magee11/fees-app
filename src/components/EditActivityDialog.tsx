import { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { useCreateActivity, useUpdateActivity } from '../hooks/queries/useActivities';
import { ApiError } from '../api/client';
import type { ActivityFormPayload } from '../api/activities';
import type { ActivityDTO, ActivityIconKey } from '../types/api';
import { ACTIVITY_ICON_KEYS } from './icons';

const EMPTY_FORM: ActivityFormPayload = {
  name: '',
  coach: '',
  monthlyFee: 0,
  schedule: '',
  capacity: 20,
  status: 'active',
  description: '',
  color: '#3B82F6',
  icon: 'karate',
};

interface EditActivityDialogProps {
  open: boolean;
  activity: ActivityDTO | null;
  onClose: () => void;
}

export function EditActivityDialog({ open, activity, onClose }: EditActivityDialogProps) {
  const [form, setForm] = useState<ActivityFormPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const isEditMode = !!activity;
  const isSubmitting = createActivity.isPending || updateActivity.isPending;

  useEffect(() => {
    if (activity) {
      setForm({
        name: activity.name,
        coach: activity.coach,
        monthlyFee: activity.monthlyFee,
        schedule: activity.schedule,
        capacity: activity.capacity,
        status: activity.status,
        description: activity.description,
        color: activity.color,
        icon: activity.icon,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [activity, open]);

  async function handleSave() {
    if (!form.name.trim() || !form.coach.trim()) return;
    setError(null);
    try {
      if (isEditMode && activity) {
        await updateActivity.mutateAsync({ id: activity._id, payload: form });
        showToast(`${form.name} updated`);
      } else {
        await createActivity.mutateAsync(form);
        showToast(`${form.name} created`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Dialog open={open} title={isEditMode ? 'Edit Activity' : 'Add Activity'} onClose={onClose}>
      <div className="form-grid">
        {error && <div className="login-error form-field full">{error}</div>}

        <div className="form-field full">
          <label className="form-label">Activity Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="form-label">Coach</label>
          <input className="input" value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="form-label">Monthly Fee</label>
          <input
            type="number"
            className="input"
            value={form.monthlyFee}
            min={0}
            onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Capacity</label>
          <input
            type="number"
            className="input"
            value={form.capacity}
            min={0}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Status</label>
          <select
            className="select"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ActivityFormPayload['status'] })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="full">Full</option>
          </select>
        </div>
        <div className="form-field full">
          <label className="form-label">Schedule</label>
          <input
            className="input"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            placeholder="Mon, Wed - 4:00 PM to 5:00 PM"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Color</label>
          <input
            type="color"
            className="input"
            style={{ padding: 4, height: 38 }}
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Icon</label>
          <select
            className="select"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value as ActivityIconKey })}
          >
            {ACTIVITY_ICON_KEYS.map((key) => (
              <option key={key} value={key}>
                {key[0].toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field full">
          <label className="form-label">Description</label>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>

      <div className="dialog-actions">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Activity'}
        </Button>
      </div>
    </Dialog>
  );
}
