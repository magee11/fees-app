import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';
import { ProgressBar } from '../components/ProgressBar';
import { useToast } from '../context/ToastContext';
import { useActivities } from '../hooks/queries/useActivities';
import { useTracker, useTrackerDetail, usePayMonths } from '../hooks/queries/useMonthlyTracker';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatCurrency } from '../utils/currency';
import { gradientForId } from '../utils/gradient';
import { monthName } from '../utils/months';
import { ApiError } from '../api/client';
import type { MonthStatus, PaymentMode, TrackerRow, TrackerRowStatus } from '../types/api';

const PAGE_SIZE = 10;
const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Bank'];
const CURRENT_YEAR = new Date().getFullYear();

const ROW_STATUS_TONE: Record<TrackerRowStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  paid: 'success',
  pending: 'danger',
  partial: 'warning',
  overdue: 'danger',
};

export function MonthlyTracker() {
  const [searchInput, setSearchInput] = useState('');
  const [filterActivity, setFilterActivity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRow, setDrawerRow] = useState<TrackerRow | null>(null);
  const [drawerSelectedMonths, setDrawerSelectedMonths] = useState<number[]>([]);
  const [lateFee, setLateFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');

  const { showToast } = useToast();
  const search = useDebouncedValue(searchInput, 350);
  useEffect(() => setPage(1), [search, filterActivity, filterStatus]);

  const { data: activitiesResp } = useActivities({ limit: 100 });
  const activities = activitiesResp?.data ?? [];

  const { data, isLoading, isError, refetch } = useTracker({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    activityId: filterActivity === 'all' ? undefined : filterActivity,
    status: filterStatus === 'all' ? undefined : filterStatus,
    year: CURRENT_YEAR,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const { data: detail } = useTrackerDetail(
    drawerRow?.studentId ?? null,
    drawerRow?.activityId ?? null,
    drawerRow?.year,
    drawerOpen,
  );
  const payMonths = usePayMonths();

  function clearFilters() {
    setSearchInput('');
    setFilterActivity('all');
    setFilterStatus('all');
  }

  function openDrawer(row: TrackerRow, month: number) {
    setDrawerRow(row);
    setDrawerSelectedMonths([month]);
    setLateFee(0);
    setDiscount(0);
    setPaymentMode('Cash');
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerRow(null);
    setDrawerSelectedMonths([]);
  }

  function toggleDrawerMonth(month: number, status: MonthStatus) {
    if (status !== 'pending' && status !== 'partial') return;
    setDrawerSelectedMonths((prev) => (prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]));
  }

  const months = detail?.months ?? drawerRow?.months ?? [];
  const fee = drawerRow?.monthlyFee ?? 0;
  const amount = drawerSelectedMonths.length * fee;
  const grandTotal = Math.max(0, amount + lateFee - discount);

  async function handleReceivePayment() {
    if (!drawerRow || drawerSelectedMonths.length === 0) return;
    try {
      const payment = await payMonths.mutateAsync({
        studentId: drawerRow.studentId,
        activityId: drawerRow.activityId,
        months: drawerSelectedMonths,
        year: drawerRow.year,
        discount,
        lateFee,
        paymentMode,
      });
      showToast(`Payment ${payment.receiptNo} of ${formatCurrency(payment.total)} recorded`);
      closeDrawer();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast('One or more selected months were already paid — refresh and try again');
      } else {
        showToast(err instanceof ApiError ? err.message : 'Failed to record payment');
      }
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Monthly Tracker</div>
          <div className="page-subtitle">12-month payment timeline per student &amp; activity</div>
        </div>
      </div>

      <div className="tracker-legend">
        <span><i className="legend-dot" style={{ background: 'var(--success)' }} />Paid</span>
        <span><i className="legend-dot" style={{ background: 'var(--danger)' }} />Pending</span>
        <span><i className="legend-dot" style={{ background: 'var(--warning)' }} />Partial</span>
        <span><i className="legend-dot" style={{ background: 'var(--track)' }} />Not started</span>
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
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>
        <Button variant="ghost" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      <div className="card tracker-card">
        <div className="tracker-row tracker-row-header">
          <span className="tracker-student-col">Student</span>
          <span className="tracker-months-col">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i}>{monthName(i + 1).slice(0, 1)}</span>
            ))}
          </span>
          <span className="tracker-balance-col">Outstanding</span>
        </div>

        {isLoading && <div className="empty-state">Loading tracker…</div>}
        {isError && (
          <div className="empty-state">
            Couldn&apos;t load the tracker.{' '}
            <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="empty-state">No students match your filters.</div>
        )}

        {rows.map((row) => (
          <div key={`${row.studentId}-${row.activityId}`} className="tracker-row">
            <span className="tracker-student-col">
              <span className="student-cell-name">
                <Avatar name={row.studentName} gradient={gradientForId(row.studentId)} size={36} />
                <span>
                  <span className="student-name">{row.studentName}</span>
                  <span className="student-admission">
                    {row.standard}-{row.section} · {row.activityName}
                  </span>
                </span>
              </span>
            </span>

            <span className="tracker-months-col">
              <span className="tracker-month-grid">
                {row.months.map((m) => (
                  <button
                    key={m.month}
                    className={`tracker-month-cell tracker-month-${m.status}`}
                    disabled={m.status !== 'pending' && m.status !== 'partial'}
                    onClick={() => openDrawer(row, m.month)}
                    title={`${monthName(m.month)}: ${m.status}`}
                  >
                    {monthName(m.month).slice(0, 1)}
                  </button>
                ))}
              </span>
              <ProgressBar percent={row.progressPercent} />
            </span>

            <span className="tracker-balance-col">
              <span style={{ color: row.outstanding > 0 ? 'var(--warning)' : 'var(--text)', fontWeight: 700 }}>
                {formatCurrency(row.outstanding)}
              </span>
              <span className="tracker-percent">
                {row.progressPercent}% collected · <Badge tone={ROW_STATUS_TONE[row.rowStatus]}>{row.rowStatus}</Badge>
              </span>
            </span>
          </div>
        ))}

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

      <Drawer open={drawerOpen} title="Receive Payment" onClose={closeDrawer}>
        {drawerRow && (
          <>
            <div className="selected-student-card" style={{ marginTop: 0 }}>
              <Avatar name={drawerRow.studentName} gradient={gradientForId(drawerRow.studentId)} size={44} />
              <div className="selected-student-info">
                <span className="student-name">{drawerRow.studentName}</span>
                <span className="student-admission">
                  {drawerRow.standard}-{drawerRow.section} · {drawerRow.activityName} · {formatCurrency(drawerRow.monthlyFee)}/mo
                </span>
              </div>
            </div>

            <div className="form-field" style={{ marginTop: 16 }}>
              <label className="form-label">Select Months ({drawerRow.year})</label>
              <div className="month-grid">
                {months.map((m) => {
                  const clickable = m.status === 'pending' || m.status === 'partial';
                  const selected = drawerSelectedMonths.includes(m.month);
                  return (
                    <button
                      key={m.month}
                      className={`month-cell month-cell-${m.status}${selected ? ' selected' : ''}`}
                      disabled={!clickable}
                      onClick={() => toggleDrawerMonth(m.month, m.status)}
                    >
                      <span className="month-cell-label">{monthName(m.month).slice(0, 1)}</span>
                      <span className="month-cell-name">{monthName(m.month).slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {drawerSelectedMonths.length > 0 && (
              <div className="summary-months" style={{ marginTop: 14 }}>
                {drawerSelectedMonths
                  .slice()
                  .sort((a, b) => a - b)
                  .map((month) => (
                    <Badge key={month} tone="info">
                      {monthName(month)}
                    </Badge>
                  ))}
              </div>
            )}

            <div className="summary-row">
              <span>Amount</span>
              <span>{formatCurrency(amount)}</span>
            </div>

            <div className="form-field" style={{ marginTop: 12 }}>
              <label className="form-label">Late Fee</label>
              <input
                type="number"
                className="input"
                value={lateFee}
                min={0}
                onChange={(e) => setLateFee(Number(e.target.value) || 0)}
              />
            </div>
            <div className="form-field" style={{ marginTop: 12 }}>
              <label className="form-label">Discount</label>
              <input
                type="number"
                className="input"
                value={discount}
                min={0}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>

            <div className="form-field" style={{ marginTop: 12 }}>
              <label className="form-label">Payment Method</label>
              <div className="segmented">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    className={`segmented-item${paymentMode === mode ? ' active' : ''}`}
                    onClick={() => setPaymentMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="summary-row summary-total">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <Button
              className="full-width-btn"
              style={{ marginTop: 16 }}
              disabled={drawerSelectedMonths.length === 0 || payMonths.isPending}
              onClick={handleReceivePayment}
            >
              {payMonths.isPending ? 'Processing…' : 'Receive Payment'}
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
}
