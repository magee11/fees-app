import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useToast } from '../context/ToastContext';
import { useImportStudents } from '../hooks/queries/useStudents';
import { downloadImportTemplate } from '../api/students';
import { triggerBlobDownload } from '../utils/download';
import { ApiError } from '../api/client';
import type { ImportStudentsResult } from '../types/api';

interface ImportStudentsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportStudentsDialog({ open, onClose }: ImportStudentsDialogProps) {
  const { showToast } = useToast();
  const importStudents = useImportStudents();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportStudentsResult | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function handleClose() {
    setFile(null);
    setResult(null);
    onClose();
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const { blob, filename } = await downloadImportTemplate('excel');
      triggerBlobDownload(blob, filename);
    } catch {
      showToast('Failed to download template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setResult(null);
    try {
      const res = await importStudents.mutateAsync(file);
      if (res.failed === 0) {
        showToast(`${res.created} student(s) imported successfully`);
        handleClose();
      } else {
        setResult(res);
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Import failed');
    }
  }

  return (
    <Dialog open={open} title="Import Students" onClose={handleClose}>
      <div className="form-grid">
        <div className="form-field full">
          <label className="form-label">1. Download the template</label>
          <p className="form-hint">
            Fill in one row per student. The template&apos;s second sheet lists the exact activity names to use.
          </p>
          <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} disabled={isDownloadingTemplate}>
            {isDownloadingTemplate ? 'Preparing…' : 'Download Template (.xlsx)'}
          </Button>
        </div>

        <div className="form-field full">
          <label className="form-label">2. Upload the filled-in file</label>
          <input
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="input"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
          />
        </div>

        {result && (
          <div className="form-field full import-result">
            <div className="import-result-summary">
              {result.totalRows} row(s) processed · {result.created} created · {result.failed} failed
            </div>
            {result.errors.length > 0 && (
              <div className="import-error-list">
                {result.errors.map((e) => (
                  <div key={e.row} className="import-error-row">
                    Row {e.row}: {e.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dialog-actions">
        <Button variant="secondary" onClick={handleClose} disabled={importStudents.isPending}>
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button variant="primary" onClick={handleUpload} disabled={!file || importStudents.isPending}>
            {importStudents.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
