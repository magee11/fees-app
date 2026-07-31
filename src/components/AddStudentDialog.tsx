import { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useAddStudentDialog } from '../context/AddStudentContext';
import { useToast } from '../context/ToastContext';
import { useActivities } from '../hooks/queries/useActivities';
import { useCreateStudent, useUpdateStudent } from '../hooks/queries/useStudents';
import { ApiError } from '../api/client';
import type { StudentStatus } from '../types/api';

const CLASSES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const SECTIONS = ['A', 'B', 'C'];

interface FormState {
  name: string;
  standard: string;
  section: string;
  status?: StudentStatus;
}

const EMPTY_FORM: FormState = {
  name: '',
  standard: CLASSES[0],
  section: SECTIONS[0],
};

export function AddStudentDialog() {
  const { open, editingStudent, closeDialog } = useAddStudentDialog();
  const { showToast } = useToast();
  const { data: activitiesResp } = useActivities({ limit: 100 });
  const activities = activitiesResp?.data ?? [];
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingStudent;
  const isSubmitting = createStudent.isPending || updateStudent.isPending;

  useEffect(() => {
    if (editingStudent) {
      setForm({
        name: editingStudent.name,
        standard: editingStudent.standard,
        section: editingStudent.section,
        status: editingStudent.status,
      });
      setSelectedActivities(editingStudent.activities.map((a) => a._id));
    } else {
      setForm(EMPTY_FORM);
      setSelectedActivities([]);
    }
    setError(null);
  }, [editingStudent, open]);

  function handleClose() {
    closeDialog();
  }

  function toggleActivity(id: string) {
    setSelectedActivities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  const canSave = form.name.trim().length > 0 && !!form.standard && !!form.section;

  async function handleSave() {
    if (!canSave) return;
    setError(null);

    try {
      if (isEditMode && editingStudent) {
        await updateStudent.mutateAsync({
          id: editingStudent._id,
          payload: {
            name: form.name.trim(),
            standard: form.standard,
            section: form.section,
            activities: selectedActivities,
            status: form.status,
          },
        });
        showToast(`${form.name} updated successfully`);
      } else {
        await createStudent.mutateAsync({
          name: form.name.trim(),
          standard: form.standard,
          section: form.section,
          activities: selectedActivities,
        });
        showToast(`${form.name} added successfully`);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Dialog open={open} title={isEditMode ? 'Edit Student' : 'Add Student'} onClose={handleClose}>
      <div className="form-grid">
        {error && (
          <div className="login-error form-field full">
            {error}
          </div>
        )}

        <div className="form-field full">
          <label className="form-label">Full Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Aarav Sharma"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Standard</label>
          <select
            className="select"
            value={form.standard}
            onChange={(e) => setForm({ ...form, standard: e.target.value })}
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Section</label>
          <select
            className="select"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {isEditMode && (
          <div className="form-field full">
            <label className="form-label">Status</label>
            <select
              className="select"
              value={form.status ?? 'active'}
              onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        )}
        <div className="form-field full">
          <label className="form-label">Activities (optional)</label>
          <div className="checkbox-grid">
            {activities.map((a) => (
              <label
                key={a._id}
                className={`checkbox-chip${selectedActivities.includes(a._id) ? ' checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedActivities.includes(a._id)}
                  onChange={() => toggleActivity(a._id)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="dialog-actions">
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSubmitting || !canSave}>
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Save Student'}
        </Button>
      </div>
    </Dialog>
  );
}
