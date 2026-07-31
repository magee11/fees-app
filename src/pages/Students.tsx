import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Upload, Download, Plus, ChevronDown, ChevronRight, Pencil, Trash2, CheckSquare } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ImportStudentsDialog } from '../components/ImportStudentsDialog';
import { PageLoader } from '../components/PageLoader';
import { useAddStudentDialog } from '../context/AddStudentContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/queries/useActivities';
import {
  useBulkDeleteStudents,
  useDeleteStudent,
  useStudentPaymentHistory,
  useStudents,
} from '../hooks/queries/useStudents';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { exportStudents } from '../api/students';
import { triggerBlobDownload } from '../utils/download';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { gradientForId } from '../utils/gradient';
import type { StudentDTO, StudentStatus } from '../types/api';
import { ApiError } from '../api/client';

const PAGE_SIZE_OPTIONS = [10, 20, 30] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number] | 'all';
const ALL_PAGE_SIZE_LIMIT = 1000;

const STATUS_TONE: Record<StudentStatus, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  inactive: 'neutral',
  overdue: 'danger',
};

function PaymentHistoryPanel({ student }: { student: StudentDTO }) {
  const { data, isLoading } = useStudentPaymentHistory(student._id, { page: 1, limit: 6 }, true);

  return (
    <div className="student-history fade-up">
      <div className="card-kicker" style={{ marginBottom: 10 }}>
        Recent Payments
      </div>
      {isLoading && <PageLoader label="Loading payments…" compact />}
      {!isLoading && (data?.data.length ?? 0) === 0 && <div className="empty-state">No payments yet.</div>}
      {!isLoading && (data?.data.length ?? 0) > 0 && (
        <div className="txn-list">
          {data!.data.map((p) => (
            <div key={p._id} className="txn-row">
              <div className="txn-info">
                <div className="txn-name">
                  {p.receiptNo} · {p.activityId?.name ?? 'Deleted Activity'}
                </div>
                <div className="txn-sub">
                  {p.months.length} month{p.months.length > 1 ? 's' : ''} · {p.paymentMode}
                </div>
              </div>
              <div className="txn-amount">+{formatCurrency(p.total)}</div>
              <div className="txn-date">{formatDate(p.paymentDate)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Students() {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '');
  const [filterActivity, setFilterActivity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { openDialog } = useAddStudentDialog();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const deleteStudent = useDeleteStudent();
  const bulkDeleteStudents = useBulkDeleteStudents();

  const search = useDebouncedValue(searchInput, 350);
  useEffect(() => setPage(1), [search, filterActivity, filterStatus, pageSize]);
  useEffect(() => setSelectedIds(new Set()), [page, search, filterActivity, filterStatus]);

  // Re-sync when navigated here from the header search with a new `?q=` value
  // (route stays mounted, so the useState initializer above won't fire again).
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchInput(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data: activitiesResp } = useActivities({ limit: 100 });
  const activities = activitiesResp?.data ?? [];

  const { data, isLoading, isError, refetch } = useStudents({
    page,
    limit: pageSize === 'all' ? ALL_PAGE_SIZE_LIMIT : pageSize,
    search: search || undefined,
    activityId: filterActivity === 'all' ? undefined : filterActivity,
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  const students = data?.data ?? [];
  const meta = data?.meta;

  function clearFilters() {
    setSearchInput('');
    setFilterActivity('all');
    setFilterStatus('all');
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function toggleSelectMode() {
    if (selectMode) setSelectedIds(new Set());
    setSelectMode((prev) => !prev);
  }

  const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s._id));

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(students.map((s) => s._id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`Delete ${count} selected student${count > 1 ? 's' : ''}? This cannot be undone.`)) return;
    try {
      const result = await bulkDeleteStudents.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      setExpandedId(null);
      showToast(
        result.failed === 0
          ? `${result.deleted} student${result.deleted > 1 ? 's' : ''} deleted`
          : `${result.deleted} deleted, ${result.failed} failed`,
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete selected students');
    }
  }

  async function handleDelete(student: StudentDTO) {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      await deleteStudent.mutateAsync(student._id);
      showToast(`${student.name} deleted`);
      if (expandedId === student._id) setExpandedId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete student');
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const { blob, filename } = await exportStudents({
        search: search || undefined,
        activityId: filterActivity === 'all' ? undefined : filterActivity,
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      triggerBlobDownload(blob, filename);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to export students');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Students</div>
          <div className="page-subtitle">{meta ? `${meta.total} students found` : '…'}</div>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <Button variant="secondary" onClick={toggleSelectMode}>
              <CheckSquare size={15} />
              {selectMode ? 'Cancel Select' : 'Select'}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload size={15} />
            Import
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
            <Download size={15} />
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus size={15} />
            Add Student
          </Button>
        </div>
      </div>

      <div className="card toolbar-card">
        <div className="input-icon-wrap toolbar-search">
          <Search size={15} />
          <input
            className="input"
            placeholder="Search by name or admission no…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select className="select" value={filterActivity} onChange={(e) => setFilterActivity(e.target.value)}>
          <option value="all">All Activities</option>
          {activities.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="select"
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSize))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
          <option value="all">Show All</option>
        </select>
        <Button variant="ghost" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      {isAdmin && selectMode && selectedIds.size > 0 && (
        <div className="card bulk-actions-bar">
          <span className="bulk-actions-count">{selectedIds.size} selected</span>
          <div className="bulk-actions-buttons">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear selection
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkDelete} disabled={bulkDeleteStudents.isPending}>
              <Trash2 size={14} />
              {bulkDeleteStudents.isPending ? 'Deleting…' : 'Delete Selected'}
            </Button>
          </div>
        </div>
      )}

      <div className="card student-list-card">
        <div className={`student-row student-row-header${isAdmin && selectMode ? ' has-select' : ''}`}>
          {isAdmin && selectMode && (
            <span onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                aria-label="Select all students on this page"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
            </span>
          )}
          <span>Student</span>
          <span>Class</span>
          <span>Activities</span>
          <span>Monthly Fee</span>
          <span>Balance</span>
          <span>Status</span>
          <span />
        </div>

        {isLoading && <PageLoader label="Loading students…" />}
        {isError && (
          <div className="empty-state">
            Couldn&apos;t load students.{' '}
            <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !isError && students.length === 0 && (
          <div className="empty-state">No students match your filters.</div>
        )}

        {students.map((s) => {
          const expanded = expandedId === s._id;
          const monthlyFee = s.activities.reduce((sum, a) => sum + a.monthlyFee, 0);

          return (
            <div key={s._id} className="student-row-group">
              <div
                className={`student-row${isAdmin && selectMode ? ' has-select' : ''}`}
                onClick={() => toggleExpanded(s._id)}
              >
                {isAdmin && selectMode && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.name}`}
                      checked={selectedIds.has(s._id)}
                      onChange={() => toggleSelect(s._id)}
                    />
                  </span>
                )}
                <span className="student-cell-name">
                  <Avatar name={s.name} gradient={gradientForId(s._id)} />
                  <span>
                    <span className="student-name">{s.name}</span>
                    <span className="student-admission">{s.admissionNo}</span>
                  </span>
                </span>
                <span data-label="Class">
                  {s.standard}-{s.section}
                </span>
                <span className="student-activities" data-label="Activities">
                  {s.activities.length > 0 ? s.activities.map((a) => a.name).join(', ') : '—'}
                </span>
                <span data-label="Monthly Fee">{formatCurrency(monthlyFee)}</span>
                <span
                  data-label="Balance"
                  style={{ color: (s.outstanding ?? 0) > 0 ? 'var(--warning)' : 'var(--text)' }}
                >
                  {formatCurrency(s.outstanding ?? 0)}
                </span>
                <span data-label="Status">
                  <Badge tone={STATUS_TONE[s.status]} dot>
                    {s.status[0].toUpperCase() + s.status.slice(1)}
                  </Badge>
                </span>
                <span className="student-row-actions">
                  <button
                    className="icon-btn"
                    style={{ width: 28, height: 28 }}
                    aria-label="Edit student"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDialog(s);
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  {isAdmin && (
                    <button
                      className="icon-btn"
                      style={{ width: 28, height: 28 }}
                      aria-label="Delete student"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </div>

              {expanded && <PaymentHistoryPanel student={s} />}
            </div>
          );
        })}

        {meta && meta.totalPages > 1 && (
          <div className="pagination">
            <Button variant="secondary" size="sm" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="pagination-info">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button variant="secondary" size="sm" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      <ImportStudentsDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
