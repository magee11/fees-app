import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Upload, Download, Plus, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAddStudentDialog } from '../context/AddStudentContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/queries/useActivities';
import { useDeleteStudent, useStudentPaymentHistory, useStudents } from '../hooks/queries/useStudents';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { gradientForId } from '../utils/gradient';
import type { StudentDTO, StudentStatus } from '../types/api';
import { ApiError } from '../api/client';

const PAGE_SIZE = 10;

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
      {isLoading && <div className="empty-state">Loading…</div>}
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
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { openDialog } = useAddStudentDialog();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const deleteStudent = useDeleteStudent();

  const search = useDebouncedValue(searchInput, 350);
  useEffect(() => setPage(1), [search, filterActivity, filterStatus]);

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
    limit: PAGE_SIZE,
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

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Students</div>
          <div className="page-subtitle">{meta ? `${meta.total} students found` : '…'}</div>
        </div>
        <div className="page-actions">
          <Button variant="secondary" onClick={() => showToast('Import is not yet supported')}>
            <Upload size={15} />
            Import
          </Button>
          <Button variant="secondary" onClick={() => showToast('Export is not yet supported')}>
            <Download size={15} />
            Export
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
            placeholder="Search by name, admission no, or phone…"
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
        <Button variant="ghost" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      <div className="card student-list-card">
        <div className="student-row student-row-header">
          <span>Student</span>
          <span>Class</span>
          <span>Activities</span>
          <span>Monthly Fee</span>
          <span>Balance</span>
          <span>Status</span>
          <span />
        </div>

        {isLoading && <div className="empty-state">Loading students…</div>}
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
              <div className="student-row" onClick={() => toggleExpanded(s._id)}>
                <span className="student-cell-name">
                  <Avatar name={s.name} gradient={gradientForId(s._id)} />
                  <span>
                    <span className="student-name">{s.name}</span>
                    <span className="student-admission">{s.admissionNo}</span>
                  </span>
                </span>
                <span>
                  {s.standard}-{s.section}
                </span>
                <span className="student-activities">
                  {s.activities.length > 0 ? s.activities.map((a) => a.name).join(', ') : '—'}
                </span>
                <span>{formatCurrency(monthlyFee)}</span>
                <span style={{ color: (s.outstanding ?? 0) > 0 ? 'var(--warning)' : 'var(--text)' }}>
                  {formatCurrency(s.outstanding ?? 0)}
                </span>
                <span>
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
    </div>
  );
}
