import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSettings, useUpdateSettings, useUploadLogo } from '../hooks/queries/useSettings';
import { API_ORIGIN, ApiError } from '../api/client';
import type { SettingsFormPayload } from '../types/api';

const EMPTY_FORM: SettingsFormPayload = {
  schoolName: '',
  schoolAddress: '',
  schoolPhone: '',
  schoolEmail: '',
  academicYear: '',
  receiptPrefix: '',
  partialPaymentPercentage: 50,
  currency: 'INR',
};

export function Settings() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadLogo = useUploadLogo();

  const [form, setForm] = useState<SettingsFormPayload>(EMPTY_FORM);

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.schoolName,
        schoolAddress: settings.schoolAddress,
        schoolPhone: settings.schoolPhone,
        schoolEmail: settings.schoolEmail,
        academicYear: settings.academicYear,
        receiptPrefix: settings.receiptPrefix,
        partialPaymentPercentage: settings.partialPaymentPercentage,
        currency: settings.currency,
      });
    }
  }, [settings]);

  async function handleSave() {
    try {
      await updateSettings.mutateAsync(form);
      showToast('Settings saved');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save settings');
    }
  }

  async function handleLogoChange(file: File | null) {
    if (!file) return;
    try {
      await uploadLogo.mutateAsync(file);
      showToast('Logo updated');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to upload logo');
    }
  }

  if (isLoading) {
    return <div className="fade-up empty-state" style={{ padding: '60px 0' }}>Loading settings…</div>;
  }

  if (isError || !settings) {
    return (
      <div className="fade-up empty-state" style={{ padding: '60px 0' }}>
        Couldn&apos;t load settings.{' '}
        <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">
            {isAdmin ? 'School information and receipt configuration' : 'View-only — contact an admin to make changes'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="settings-logo-row">
          <div className="settings-logo-preview">
            {settings.logo ? (
              <img src={`${API_ORIGIN}${settings.logo}`} alt="School logo" />
            ) : (
              <ImageIcon size={22} color="var(--text-muted)" />
            )}
          </div>
          {isAdmin && (
            <div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                {uploadLogo.isPending ? 'Uploading…' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                  disabled={uploadLogo.isPending}
                />
              </label>
            </div>
          )}
        </div>

        <div className="settings-form">
          <div className="form-field">
            <label className="form-label">School Name</label>
            <input
              className="input"
              value={form.schoolName}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Academic Year</label>
            <input
              className="input"
              value={form.academicYear}
              disabled={!isAdmin}
              placeholder="2026-2027"
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">School Phone</label>
            <input
              className="input"
              value={form.schoolPhone}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, schoolPhone: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">School Email</label>
            <input
              type="email"
              className="input"
              value={form.schoolEmail}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, schoolEmail: e.target.value })}
            />
          </div>
          <div className="form-field full">
            <label className="form-label">School Address</label>
            <input
              className="input"
              value={form.schoolAddress}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, schoolAddress: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Receipt Prefix</label>
            <input
              className="input"
              value={form.receiptPrefix}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, receiptPrefix: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Currency</label>
            <input
              className="input"
              value={form.currency}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </div>
          <div className="form-field full">
            <label className="form-label">Partial Payment Percentage</label>
            <input
              type="number"
              className="input"
              min={0}
              max={100}
              value={form.partialPaymentPercentage}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, partialPaymentPercentage: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        {isAdmin && (
          <div className="dialog-actions" style={{ marginTop: 24 }}>
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
